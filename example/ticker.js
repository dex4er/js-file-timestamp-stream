const FileTimestampStream = require('../lib/file-timestamp-stream')

const stream = new FileTimestampStream({
  path: './%Y-%m-%dT%H:%M:%S.log',
  flags: 'a'
})

setInterval(() => {
  let date = new Date()
  stream.write(`tick: ${date}\r\n`)
  console.log(`Written to ${stream.currentFilename}`)
}, 800)
