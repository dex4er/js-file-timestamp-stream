'use strict'

const fs = require('fs')
const stream = require('stream')
const strftime = require('ultra-strftime')

class FileTimestampStream extends stream.Writable {
  constructor (options) {
    super(options)

    this.options = options || {}

    this.newFilename = this.options.newFilename || (() => {
      return strftime(this.path, new Date())
    })

    this.flags = this.options.flags != null ? this.options.flags : 'a'
    this.fs = this.options.fs || fs
    this.path = this.options.path || 'out.log'

    this.currentFilename = null
    this.wstream = null
  }

  _rotate (encoding) {
    const newFilename = this.newFilename()

    if (newFilename !== this.currentFilename) {
      if (this.wstream) {
        this.wstream.end()
      }
      this.wstream = this.fs.createWriteStream(newFilename, {
        flags: this.flags,
        encoding: encoding === 'buffer' ? 'utf8' : null
      })
      this.currentFilename = newFilename
    }
  }

  _write (chunk, encoding, callback) {
    try {
      this._rotate(encoding)
      // call private method (bypass additional buffers)
      return this.wstream._write(chunk, encoding, callback)
    } catch (e) {
      return callback(e)
    }
  }

  _writev (chunks, callback) {
    try {
      this._rotate('buffer')
      // call private method (not supported before node 4.0?)
      return this.wstream._writev(chunks, callback)
    } catch (e) {
      return callback(e)
    }
  }
}

module.exports = FileTimestampStream
