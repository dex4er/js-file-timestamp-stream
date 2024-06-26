#!/usr/bin/env -S node --experimental-specifier-resolution=node --experimental-modules --no-warnings --loader ts-node/esm

import FileTimestampStream from "../src/file-timestamp-stream.js"

import * as timers from "timers-obj"
import strftime from "ultra-strftime"

class MyFileTimestampStream extends FileTimestampStream {
  lineCounter = 0
  fileCounter = 0

  countWrittenLines(): void {
    console.info(`Written line #${++this.lineCounter} to ${this.currentFilename} (file #${this.fileCounter})`)
  }

  protected newFilename(): string {
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
