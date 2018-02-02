'use strict'

const fs = require('fs')
const Writable = require('stream').Writable
const strftime = require('ultra-strftime')

class FileTimestampStream extends Writable {
  constructor (options) {
    super(options)

    this.options = options || {}

    this.newFilename = this.options.newFilename || (() => {
      return strftime(this.path, new Date())
    })

    this.flags = this.options.flags != null ? this.options.flags : 'a'
    this.fs = this.options.fs || fs
    this.path = this.options.path || 'out.log'

    this.currentFilename = undefined
    this.stream = undefined

    this._streamErrorHandler = (err) => {
      this.emit('error', err)
    }
  }

  _rotate (encoding) {
    const newFilename = this.newFilename()

    if (newFilename !== this.currentFilename) {
      if (this.stream) {
        this.stream.end()
        this.stream.removeListener('error', this._streamErrorHandler)
      }

      this.stream = this.fs.createWriteStream(newFilename, {
        flags: this.flags,
        encoding: encoding === 'buffer' ? 'utf8' : null
      })

      this.stream.on('error', this._streamErrorHandler)

      this.currentFilename = newFilename
    }
  }

  _write (chunk, encoding, callback) {
    try {
      this._rotate(encoding)
      this.stream.write(chunk, encoding, callback)
    } catch (e) {
      callback(e)
    }
  }

  _destroy (err, callback) {
    if (this.stream) {
      this.stream.destroy()
      this.stream.removeListener('error', this._streamErrorHandler)
    }
    super._destroy(err, callback)
  }
}

FileTimestampStream.FileTimestampStream = FileTimestampStream
FileTimestampStream.default = FileTimestampStream

module.exports = FileTimestampStream
