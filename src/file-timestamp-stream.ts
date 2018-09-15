/// <reference types="node" />

import fs, { WriteStream } from 'fs'
import { Writable, WritableOptions } from 'stream'
import { interval, Interval } from 'timers-obj'
import strftime from 'ultra-strftime'

// tslint:disable-next-line:no-var-requires
const finished = require('stream.finished') as (stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream, callback?: (err: NodeJS.ErrnoException) => void) => () => void // TODO: wait for new typings for node

export interface FileTimestampStreamOptions extends WritableOptions {
  flags?: string | null
  fs?: typeof fs
  path?: string
}

export class FileTimestampStream extends Writable {
  static readonly CLOSE_UNUSED_FILE_AFTER = 1000

  readonly flags: string
  readonly fs: typeof fs
  readonly path: string

  protected currentFilename?: string
  protected stream?: WriteStream

  private destroyed = false
  private streams: Map<string, WriteStream> = new Map()
  private streamCancelFinishers: Map<string, () => void> = new Map()
  private streamErrorHandlers: Map<string, (err: Error) => void> = new Map()
  private timer?: Interval
  private timers: Map<string, Interval> = new Map()

  constructor (options: FileTimestampStreamOptions = {}) {
    super(options)

    this.flags = options.flags || 'a'
    this.fs = options.fs || fs
    this.path = options.path || 'out.log'
  }

  _write (chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    if (this.destroyed) {
      return callback(new Error('write after destroy'))
    }

    try {
      this.rotate()
      this.stream!.write(chunk, encoding, callback)
    } catch (e) {
      callback(e)
    }
  }

  _writev (chunks: Array<{ chunk: any, encoding: string }>, callback: (error?: Error | null) => void): void {
    if (this.destroyed) {
      return callback(new Error('write after destroy'))
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
      callback(e)
    }
  }

  _final (callback: (error?: Error | null) => void): void {
    if (this.stream) {
      this.stream.end(callback)
    } else {
      callback()
    }
  }

  _destroy (error: Error | null, callback: (error: Error | null) => void): void {
    if (this.streamErrorHandlers.size > 0) {
      for (const [filename, handler] of this.streamErrorHandlers) {
        const stream = this.streams.get(filename)
        if (stream) {
          stream.removeListener('error', handler)
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
        // tslint:disable-next-line:strict-type-predicates
        if (typeof stream.destroy === 'function') {
          stream.destroy()
        }
      }
      this.streams.clear()
    }
    if (this.timers.size > 0) {
      for (const timer of this.timers.values()) {
        timer.remove()
      }
      this.streams.clear()
    }

    this.destroyed = true
    this.stream = undefined
    this.timer = undefined

    callback(error)
  }

  /** Override this */
  protected newFilename (): string {
    return strftime(this.path, new Date())
  }

  private rotate (): void {
    const newFilename = this.newFilename()
    const { currentFilename, stream, timer } = this

    if (newFilename !== currentFilename) {
      if (currentFilename && stream && timer) {
        timer.remove()
        stream.end()

        const streamErrorHandler = this.streamErrorHandlers.get(currentFilename)

        if (streamErrorHandler) {
          stream.removeListener('error', streamErrorHandler)
          this.streamErrorHandlers.delete(currentFilename)
        }
      }

      const newStream = this.fs.createWriteStream(newFilename, {
        flags: this.flags
      })
      this.stream = newStream
      this.streams.set(newFilename, newStream)

      const newStreamErrorHandler = (err: Error) => {
        this.emit('error', err)
      }
      newStream.on('error', newStreamErrorHandler)
      this.streamErrorHandlers.set(newFilename, newStreamErrorHandler)

      const newTimer = interval(FileTimestampStream.CLOSE_UNUSED_FILE_AFTER, () => {
        if (newFilename !== this.newFilename()) {
          newTimer.remove()
          this.timers.delete(newFilename)

          newStream.end()
        }
      })
      this.timer = timer
      this.timers.set(newFilename, newTimer)

      const newStreamCancelFinisher = finished(newStream, () => {
        newTimer.remove()
        this.timers.delete(newFilename)

        // tslint:disable-next-line:strict-type-predicates
        if (typeof newStream.destroy === 'function') {
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
