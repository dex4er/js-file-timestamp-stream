/// <reference types="node" />

import * as fs from "node:fs"
import {WriteStream} from "node:fs"
import {finished, Writable, WritableOptions} from "node:stream"

import * as timers from "timers-obj"
import strftime from "ultra-strftime"

export interface FileTimestampStreamOptions extends WritableOptions {
  /** a string with [flags](https://nodejs.org/api/fs.html#fs_fs_open_path_flags_mode_callback) for opened stream (default: `'a'`) */
  flags?: string | null
  /** a custom [fs](https://nodejs.org/api/fs.html) module (optional) */
  fs?: typeof fs
  /** a template for new filenames (default: `'out.log'`) */
  path?: string
}

export class FileTimestampStream extends Writable {
  static readonly CLOSE_UNUSED_FILE_AFTER = 1000

  readonly flags = this.options.flags || "a"
  readonly fs = this.options.fs || fs
  readonly path = this.options.path || "out.log"

  destroyed = false

  /** contains last opened filename */
  protected currentFilename?: string
  /** contains current [fs.WriteStream](https://nodejs.org/api/fs.html#fs_class_fs_writestream) object */
  protected stream?: WriteStream

  private readonly streams: Map<string, WriteStream> = new Map()
  private readonly streamCancelFinishers: Map<string, () => void> = new Map()
  private readonly streamErrorHandlers: Map<string, (err: Error) => void> = new Map()
  private readonly closers: Map<string, timers.Interval> = new Map()

  private closer?: NodeJS.Timer

  constructor(private options: FileTimestampStreamOptions = {}) {
    super(options)
  }

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    if (this.destroyed) {
      return callback(new Error("write after destroy"))
    }

    try {
      this.rotate()
      this.stream!.write(chunk, encoding, callback)
    } catch (e) {
      callback(e as Error)
    }
  }

  _writev(chunks: Array<{chunk: any; encoding: BufferEncoding}>, callback: (error?: Error | null) => void): void {
    if (this.destroyed) {
      return callback(new Error("write after destroy"))
    }

    let corked = false
    try {
      this.rotate()
      corked = true
      this.stream!.cork()
      for (const chunk of chunks) {
        this.stream!.write(chunk.chunk, chunk.encoding)
      }
      process.nextTick(() => this.stream!.uncork())
      callback()
    } catch (e) {
      if (corked) {
        process.nextTick(() => this.stream!.uncork())
      }
      callback(e as Error)
    }
  }

  _final(callback: (error?: Error | null) => void): void {
    if (this.stream) {
      this.stream.end(callback)
    } else {
      callback()
    }
  }

  _destroy(error: Error | null, callback: (error: Error | null) => void): void {
    if (this.streamErrorHandlers.size > 0) {
      for (const [filename, handler] of this.streamErrorHandlers) {
        const stream = this.streams.get(filename)
        if (stream) {
          stream.removeListener("error", handler)
        }
      }
      this.streamErrorHandlers.clear()
    }
    if (this.streamCancelFinishers.size > 0) {
      for (const [filename, cancel] of this.streamCancelFinishers) {
        cancel()
        this.streamCancelFinishers.delete(filename)
      }
      this.streamCancelFinishers.clear()
    }
    if (this.streams.size > 0) {
      for (const stream of this.streams.values()) {
        if (typeof stream.destroy === "function") {
          stream.destroy()
        }
      }
      this.streams.clear()
    }
    if (this.closers.size > 0) {
      for (const closer of this.closers.values()) {
        closer.close()
      }
      this.streams.clear()
    }

    this.destroyed = true
    this.stream = undefined
    this.closer = undefined

    callback(error)
  }

  /**
   * This method can be overriden in subclass
   *
   * The method generates a filename for new files. By default it returns new
   * filename based on path and current time.
   */
  protected newFilename(): string {
    return strftime(this.path, new Date())
  }

  private rotate(): void {
    const newFilename = this.newFilename()
    const {currentFilename, stream, closer} = this

    if (newFilename !== currentFilename) {
      if (currentFilename && stream && closer) {
        clearInterval(closer as NodeJS.Timeout)
        stream.end()

        const streamErrorHandler = this.streamErrorHandlers.get(currentFilename)

        if (streamErrorHandler) {
          stream.removeListener("error", streamErrorHandler)
          this.streamErrorHandlers.delete(currentFilename)
        }
      }

      const newStream = this.fs.createWriteStream(newFilename, {
        flags: this.flags,
      })
      this.stream = newStream
      this.streams.set(newFilename, newStream)

      const newStreamErrorHandler = (err: Error) => {
        this.emit("error", err)
      }
      newStream.on("error", newStreamErrorHandler)
      this.streamErrorHandlers.set(newFilename, newStreamErrorHandler)

      const newCloser = timers
        .interval(FileTimestampStream.CLOSE_UNUSED_FILE_AFTER, () => {
          if (newFilename !== this.newFilename()) {
            newCloser.close()
            this.closers.delete(newFilename)
            newStream.end()
          }
        })
        .unref()
      this.closer = closer
      this.closers.set(newFilename, newCloser)

      const newStreamCancelFinisher = finished(newStream, () => {
        newCloser.close()
        this.closers.delete(newFilename)

        if (typeof newStream.destroy === "function") {
          newStream.destroy()
        }
        this.streamCancelFinishers.delete(newFilename)
        this.streams.delete(newFilename)
      })
      this.streamCancelFinishers.set(newFilename, newStreamCancelFinisher)

      this.currentFilename = newFilename
    }
  }
}

export default FileTimestampStream
