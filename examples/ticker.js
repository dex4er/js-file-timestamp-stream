#!/usr/bin/env node

'use strict'

const {FileTimestampStream} = require('../lib/file-timestamp-stream')

const strftime = require('ultra-strftime')

class MyFileTimestampStream extends FileTimestampStream {
  constructor(options) {
    super(options)

    this.lineCounter = 0
    this.fileCounter = 0
  }

  countWrittenLines() {
    console.info(`Written line #${++this.lineCounter} to ${this.currentFilename} (file #${this.fileCounter})`)
  }

  newFilename() {
    const filename = strftime(this.path)
    if (filename !== this.currentFilename) this.fileCounter++
    return filename
  }
}

const stream = new MyFileTimestampStream({
  path: '%Y-%m-%dT%H:%M:%S.log',
})

setInterval(() => {
  const date = new Date()
  stream.write(`tick: ${date}\r\n`)
  stream.countWrittenLines()
}, 800)
