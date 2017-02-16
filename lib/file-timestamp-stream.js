'use strict'

var fs = require('fs')
var stream = require('stream')
var strftime = require('ultra-strftime')

function fileTimestampStream (options) {
  this.options = options || {}

  this.newFilename = this.options.newFilename || function () {
    return strftime(this.path, new Date())
  }
  this.flags = this.options.flags != null ? this.options.flags : 'a'
  this.fs = this.options.fs || fs
  this.path = this.options.path || 'out.log'

  this.currentFilename = null
  this.wstream = null

  stream.Writable.call(this, options)
}

fileTimestampStream.prototype = Object.create(stream.Writable.prototype)

fileTimestampStream.prototype.constructor = fileTimestampStream

fileTimestampStream.prototype._rotate = function (encoding) {
  var fsEncoding
  var newFilename = this.newFilename()
  if (newFilename !== this.currentFilename) {
    if (this.wstream) {
      this.wstream.end()
    }
    if ((fsEncoding = encoding) === 'buffer') {
      fsEncoding = 'utf8'
    }
    this.wstream = this.fs.createWriteStream(newFilename, {
      flags: this.flags,
      encoding: fsEncoding
    })
    this.currentFilename = newFilename
  }
}

fileTimestampStream.prototype._write = function (chunk, encoding, callback) {
  try {
    this._rotate(encoding)
    // call private method (bypass additional buffers)
    return this.wstream._write(chunk, encoding, callback)
  } catch (e) {
    callback(e)
  }
}

fileTimestampStream.prototype._writev = function (chunks, callback) {
  try {
    this._rotate('buffer')
    // call private method (not supported before node 4.0?)
    return this.wstream._writev(chunks, callback)
  } catch (e) {
    return callback(e)
  }
}

module.exports = fileTimestampStream
