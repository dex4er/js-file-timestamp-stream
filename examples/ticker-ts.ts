#!/usr/bin/env ts-node

import FileTimestampStream from '../src/file-timestamp-stream'

import strftime from 'ultra-strftime'

let lineCounter = 0
let fileCounter = 0

const stream = new FileTimestampStream({
  path: '%Y-%m-%dT%H:%M:%S.log',
  newFilename
})

function newFilename (fileTimestampStream: FileTimestampStream): string {
  const filename = strftime(fileTimestampStream.path)
  if (filename !== fileTimestampStream.currentFilename) fileCounter++
  return filename
}

setInterval(() => {
  const date = new Date()
  stream.write(`tick: ${date}\r\n`)
  console.info(`Written line #${++lineCounter} to ${stream.currentFilename} (file #${fileCounter})`)
}, 800)
