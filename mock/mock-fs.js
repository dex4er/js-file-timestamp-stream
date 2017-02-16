class MockWriteStream {
  constructor (filename, options) {
    this.filename = filename
    this.options = options
    this.content = Buffer.alloc(0)
  }

  _write (chunk, encoding, callback) {
    this.content = Buffer.concat([this.content, chunk])

    if (callback) {
      callback()
    }
  }

  _writev (chunks, callback) {
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
    return new MockWriteStream(filename, options)
  }
}
