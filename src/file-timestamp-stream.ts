/// <reference types="node" />

import fs, { WriteStream } from 'fs'
import { Writable, WritableOptions } from 'stream'
import strftime from 'ultra-strftime'

// tslint:disable-next-line:no-var-requires
const finished = require('stream.finished') as (stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream, callback?: (err: NodeJS.ErrnoException) => void) => () => void // TODO: wait for new typings for node

// tslint:disable-next-line:strict-type-predicates
const HAS_DESTROY = typeof WriteStream.prototype.destroy === 'function'

export interface FileTimestampStreamOptions extends WritableOptions {
  flags?: string | null
  fs?: typeof fs
  newFilename?: (fileTimestampStream: FileTimestampStream) => string
  path?: string
}

export class FileTimestampStream extends Writable {
  readonly flags: string
  readonly fs: typeof fs
  readonly path: string

  currentFilename?: string
  stream?: WriteStream
  newFilename: (fileTimestampStream: FileTimestampStream) => string

  private streams: Map<string, WriteStream> = new Map()
  private streamCancelFinishers: Map<string, () => void> = new Map()
  private streamErrorHandlers: Map<string, (err: Error) => void> = new Map()

  constructor (options: FileTimestampStreamOptions = {}) {
    super(options)

    this.newFilename = options.newFilename || defaultNewFilename

    this.flags = options.flags || 'a'
    this.fs = options.fs || fs
    this.path = options.path || 'out.log'
  }

  _write (chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    try {
      this.rotate()
      this.stream!.write(chunk, encoding, callback)
    } catch (e) {
      callback(e)
    }
  }

  _writev (chunks: Array<{ chunk: any, encoding: string }>, callback: (error?: Error | null) => void): void {
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
      this.stream.close()
    }
    callback()
  }

  _destroy (error: Error | null, callback: (error: Error | null) => void): void {
    if (this.streamErrorHandlers.size > 0) {
      this.streamErrorHandlers.forEach((handler, filename) => {
        const stream = this.streams.get(filename)
        if (stream) {
          stream.removeListener('error', handler)
        }
      })
      this.streamErrorHandlers.clear()
    }
    if (HAS_DESTROY) {
      if (this.streamCancelFinishers.size > 0) {
        this.streamCancelFinishers.forEach((cancel, filename) => {
          cancel()
          this.streamCancelFinishers.delete(filename)
        })
        this.streamCancelFinishers.clear()
      }
    }
    if (this.streams.size > 0) {
      this.streams.forEach((stream) => {
        stream.destroy()
      })
      this.streams.clear()
    }

    this.stream = undefined

    this.newFilename = (_fileTimestampStream: any) => {
      throw new Error('write after destroy')
    }

    callback(error)
  }

  private rotate (): void {
    const newFilename = this.newFilename(this)

    if (newFilename !== this.currentFilename) {
      if (this.currentFilename && this.stream) {
        this.stream.close()
        const streamErrorHandler = this.streamErrorHandlers.get(this.currentFilename)
        if (streamErrorHandler) {
          this.stream.removeListener('error', streamErrorHandler)
          this.streamErrorHandlers.delete(this.currentFilename)
        }
        if (!HAS_DESTROY) {
          this.streams.delete(this.currentFilename)
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

      if (HAS_DESTROY) {
        const newStreamCancelFinisher = finished(newStream, () => {
          newStream.destroy()
          this.streamCancelFinishers.delete(newFilename)
          this.streams.delete(newFilename)
        })
        this.streamCancelFinishers.set(newFilename, newStreamCancelFinisher)
      }

      this.currentFilename = newFilename
    }
  }
}

function defaultNewFilename (fileTimestampStream: FileTimestampStream): string {
  return strftime(fileTimestampStream.path, new Date())
}

export default FileTimestampStream
