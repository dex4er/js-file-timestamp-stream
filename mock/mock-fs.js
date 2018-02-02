'use strict'

const Writable = require('stream').Writable

class MockWriteStream extends Writable {
  constructor (filename, options) {
    super()
    this.filename = filename
    this.options = options
    this.content = Buffer.alloc(0)
  }

  _write (chunk, encoding, callback) {
    if (this.filename === 'badwrite') {
      callback(new Error('badwrite'))
    } else {
      this.content = Buffer.concat([this.content, chunk])
      callback()
    }
  }
}

module.exports = {
  createWriteStream: (filename, options) => {
    if (filename === 'badopen') {
      throw new Error('badopen')
    } else {
      return new MockWriteStream(filename, options)
    }
  }
}
