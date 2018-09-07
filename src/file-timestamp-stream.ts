/// <reference types="node" />

import fs from 'fs'
import { Writable, WritableOptions } from 'stream'
import strftime from 'ultra-strftime'

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
  stream?: Writable
  newFilename: (fileTimestampStream: FileTimestampStream) => string

  private streamErrorHandler: (err: Error) => void

  constructor (options: FileTimestampStreamOptions = {}) {
    super(options)

    this.newFilename = options.newFilename || defaultNewFilename

    this.flags = options.flags || 'a'
    this.fs = options.fs || fs
    this.path = options.path || 'out.log'

    this.streamErrorHandler = (err) => {
      this.emit('error', err)
    }
  }

  _rotate (): void {
    const newFilename = this.newFilename(this)

    if (newFilename !== this.currentFilename) {
      if (this.stream) {
        this.stream.end()
        this.stream.removeListener('error', this.streamErrorHandler)
      }

      this.stream = this.fs.createWriteStream(newFilename, {
        flags: this.flags
      })

      this.stream.on('error', this.streamErrorHandler)

      this.currentFilename = newFilename
    }
  }

  _write (chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    try {
      this._rotate()
      this.stream!.write(chunk, encoding, callback)
    } catch (e) {
      callback(e)
    }
  }

  _writev (chunks: Array<{ chunk: any, encoding: string }>, callback: (error?: Error | null) => void): void {
    let corked = false
    try {
      this._rotate()
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
    if (this.stream) {
      this.stream.destroy()
      this.stream.removeListener('error', this.streamErrorHandler)
      delete this.streamErrorHandler
      delete this.stream
    }
    this.newFilename = (_fileTimestampStream: any) => {
      throw new Error('write after destroy')
    }
    callback(error)
  }
}

function defaultNewFilename (fileTimestampStream: FileTimestampStream): string {
  return strftime(fileTimestampStream.path, new Date())
}

export default FileTimestampStream
