import FileTimestampStream from '../lib/file-timestamp-stream'

const timestampStream = new FileTimestampStream({
  flags: 'a',
  path: './%Y-%m-%dT%H:%M:%S.log'
})

setInterval(() => {
  const date = new Date()
  timestampStream.write(`tick: ${date}\r\n`)
  console.info(`Written to ${timestampStream.currentFilename}`)
}, 800)
