'use strict'

function MockWriteStream (filename, options) {
  this.filename = filename
  this.options = options
  this.content = Buffer.alloc(0)
}

MockWriteStream.prototype.constructor = MockWriteStream

MockWriteStream.prototype._write = function (chunk, encoding, callback) {
  this.content = Buffer.concat([this.content, chunk])

  if (callback) {
    callback()
  }
}

MockWriteStream.prototype._writev = function (chunks, callback) {
  var i, len, chunk

  for (i = 0, len = chunks.length; i < len; ++i) {
    chunk = chunks[i]
    this.content = Buffer.concat([this.content, chunk])
  }

  if (callback) {
    callback()
  }
}

MockWriteStream.prototype.end = function () {}

module.exports = {
  createWriteStream: function (filename, options) {
    return new MockWriteStream(filename, options)
  }
}
