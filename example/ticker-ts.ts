import FileTimestampStream from '../lib/file-timestamp-stream'

import strftime from 'ultra-strftime'

// count how many files was created
let counter = 0

const stream = new FileTimestampStream({
  path: '%Y-%m-%dT%H:%M.log',
  newFilename
})

function newFilename (path: string): string {
  const filename = strftime(path)
  if (filename !== stream.currentFilename) counter++
  return filename
}

setInterval(() => {
  const date = new Date()
  stream.write(`tick: ${date}\r\n`)
  console.info(`Written to ${stream.currentFilename} (file #${counter})`)
}, 800)
