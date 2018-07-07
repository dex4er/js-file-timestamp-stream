'use strict'

const fs = require('fs')
const Writable = require('stream').Writable
const strftime = require('ultra-strftime')

function defaultNewFilename (path) {
  return strftime(path, new Date())
}

class FileTimestampStream extends Writable {
  constructor (options) {
    super(options)

    this.options = options || {}

    this.newFilename = this.options.newFilename || defaultNewFilename

    this.flags = this.options.flags != null ? this.options.flags : 'a'
    this.fs = this.options.fs || fs
    this.path = this.options.path || 'out.log'

    this._streamErrorHandler = (err) => {
      this.emit('error', err)
    }
  }

  _rotate () {
    const newFilename = this.newFilename(this.path)

    if (newFilename !== this.currentFilename) {
      if (this.stream) {
        this.stream.end()
        this.stream.removeListener('error', this._streamErrorHandler)
      }

      this.stream = this.fs.createWriteStream(newFilename, {
        flags: this.flags
      })

      this.stream.on('error', this._streamErrorHandler)

      this.currentFilename = newFilename
    }
  }

  _write (chunk, encoding, callback) {
    try {
      this._rotate()
      this.stream.write(chunk, encoding, callback)
    } catch (e) {
      callback(e)
    }
  }

  _writev (chunks, callback) {
    let corked = false
    try {
      this._rotate()
      corked = true
      this.stream.cork()
      for (const chunk of chunks) {
        this.stream.write(chunk.chunk, chunk.encoding)
      }
      process.nextTick(() => this.stream.uncork())
      callback()
    } catch (e) {
      if (corked) {
        process.nextTick(() => this.stream.uncork())
      }
      callback(e)
    }
  }

  _final (callback) {
    if (this.stream) {
      this.stream.end(callback)
    } else {
      callback()
    }
  }

  _destroy (err, callback) {
    if (this.stream) {
      this.stream.destroy()
      this.stream.removeListener('error', this._streamErrorHandler)
      delete this._streamErrorHandler
      delete this.stream
    }
    this.newFilename = () => {
      throw new Error('write after destroy')
    }
    callback(err)
  }
}

FileTimestampStream.FileTimestampStream = FileTimestampStream

module.exports = FileTimestampStream
