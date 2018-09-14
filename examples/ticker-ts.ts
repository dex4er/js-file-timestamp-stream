#!/usr/bin/env ts-node

import FileTimestampStream from '../src/file-timestamp-stream'

import strftime from 'ultra-strftime'

class MyFileTimestampStream extends FileTimestampStream {
  lineCounter = 0
  fileCounter = 0

  countWrittenLines (): void {
    console.info(`Written line #${++this.lineCounter} to ${this.currentFilename} (file #${this.fileCounter})`)
  }

  protected newFilename (): string {
    const filename = strftime(this.path)
    if (filename !== this.currentFilename) this.fileCounter++
    return filename
  }
}

const stream = new MyFileTimestampStream({
  path: '%Y-%m-%dT%H:%M:%S.log'
})

setInterval(() => {
  const date = new Date()
  stream.write(`tick: ${date}\r\n`)
  stream.countWrittenLines()
}, 800)
