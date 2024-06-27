#!/usr/bin/env node

import FileTimestampStream from "../lib/file-timestamp-stream.js"

import * as timers from "timers-obj"
import strftime from "ultra-strftime"

class MyFileTimestampStream extends FileTimestampStream {
  lineCounter = 0
  fileCounter = 0

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
  path: "%Y-%m-%dT%H:%M:%S.log",
})

timers.interval(800, () => {
  const date = new Date()
  stream.write(`tick: ${date}\r\n`)
  stream.countWrittenLines()
})
