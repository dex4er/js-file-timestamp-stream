'use strict'

class MockWriteStream {
  constructor (filename, options) {
    this.filename = filename
    this.options = options
    this.content = Buffer.alloc(0)
  }

  _write (chunk, encoding, callback) {
    if (this.filename === 'badwrite') {
      return callback(new Error('badwrite'))
    }

    this.content = Buffer.concat([this.content, chunk])

    return callback()
  }

  _writev (chunks, callback) {
    if (this.filename === 'badwrite') {
      callback(new Error('badwrite'))
    }

    for (let i = 0, len = chunks.length; i < len; ++i) {
      let chunk = chunks[i]
      this.content = Buffer.concat([this.content, chunk])
    }

    if (callback) {
      callback()
    }
  }

  end () {}
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
