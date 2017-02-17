'use strict'

process.env.TZ = 'GMT'

const sleep = require('sleep-promise')
const t = require('tap')

const FileTimestampStream = require('../lib/file-timestamp-stream')
const mockFs = require('../mock/mock-fs')

const TIMEOUT = 2000

t.plan(8)

t.test('Write lines to different files', {timeout: TIMEOUT}, t => {
  let filename1, filename2

  t.plan(6)

  const wstream = new FileTimestampStream({
    path: '%Y-%m-%dT%H:%M:%S.log',
    flags: 'x',
    fs: mockFs
  })

  t.type(wstream.pipe, 'function', 'wstream is stream')

  wstream.write(Buffer.from('content1\r\n'))
  t.equals(wstream.wstream.content.toString(), 'content1\r\n', 'content is correct')

  filename1 = wstream.wstream.filename
  t.equals(wstream.wstream.options.flags, 'x', 'flags for new file are correct')

  sleep(1100)
  .then(() => {
    wstream.write(Buffer.from('content2\r\n'))
    t.equals(wstream.wstream.content.toString(), 'content2\r\n', 'content is correct')

    filename2 = wstream.wstream.filename
    t.equals(wstream.wstream.options.flags, 'x', 'flags for new file are correct')
    t.notEqual(filename2, filename1, 'filenames are different')

    t.end()
  })
  .catch(err => {
    t.threw(err)
    t.end()
  })
})

t.test('Custom filename generator', {timeout: TIMEOUT}, t => {
  t.plan(8)

  let n = 0

  const wstream = new FileTimestampStream({
    newFilename: () => {
      return Math.floor(n++ / 2) + '.log'
    },
    fs: mockFs
  })

  t.type(wstream.pipe, 'function', 'wstream is stream')

  wstream.write(Buffer.from('content1\r\n'))
  t.equals(wstream.wstream.content.toString(), 'content1\r\n', 'content is correct')
  t.equals(wstream.wstream.filename, '0.log', 'filename is correct')

  wstream.write(Buffer.from('content2\r\n'))
  t.equals(wstream.wstream.content.toString(), 'content1\r\ncontent2\r\n', 'content is correct')
  t.equals(wstream.wstream.filename, '0.log', 'filename is correct')

  wstream.write(Buffer.from('content3\r\n'), () => {
    t.pass('callback was called')
    t.equals(wstream.wstream.content.toString(), 'content3\r\n', 'content is correct')
    t.equals(wstream.wstream.filename, '1.log', 'filename is correct')

    t.end()
  })
})

t.test('_writev', {timeout: TIMEOUT}, t => {
  t.plan(8)

  let n = 0

  const wstream = new FileTimestampStream({
    newFilename: () => {
      return Math.floor(n++ / 2) + '.log'
    },
    fs: mockFs
  })

  t.type(wstream.pipe, 'function', 'wstream is stream')

  wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')])
  t.equals(wstream.wstream.content.toString(), 'ABC', 'content is correct')
  t.equals(wstream.wstream.filename, '0.log', 'filename is correct')

  wstream._writev([Buffer.from('D'), Buffer.from('E'), Buffer.from('F')])
  t.equals(wstream.wstream.content.toString(), 'ABCDEF', 'content is correct')
  t.equals(wstream.wstream.filename, '0.log', 'filename is correct')

  wstream._writev([Buffer.from('G'), Buffer.from('H'), Buffer.from('I')], () => {
    t.pass('callback was called')

    t.equals(wstream.wstream.content.toString(), 'GHI', 'content is correct')
    t.equals(wstream.wstream.filename, '1.log', 'filename is correct')

    t.end()
  })
})

t.test('Default options', {timeout: TIMEOUT}, t => {
  t.plan(4)

  const wstream = new FileTimestampStream()
  wstream.fs = mockFs

  t.type(wstream.pipe, 'function', 'wstream is stream')

  wstream.write(Buffer.from('content1\r\n'))

  t.equals(wstream.wstream.content.toString(), 'content1\r\n', 'content is correct')
  t.equals(wstream.wstream.filename, 'out.log', 'filename is correct')
  t.equals(wstream.wstream.options.flags, 'a', 'flags for new file are correct')

  t.end()
})

t.test('Open error for _write', {timeout: TIMEOUT}, t => {
  t.plan(3)

  const wstream = new FileTimestampStream({
    path: 'badopen',
    fs: mockFs
  })

  t.type(wstream.pipe, 'function', 'wstream is stream')

  wstream.on('error', e => {
    t.pass('error signal was received')
    t.equal(e.message, 'badopen', 'error is correct')
    t.end()
  })
  wstream.write(Buffer.from('nevermind'))
})

t.test('Write error for _write', {timeout: TIMEOUT}, t => {
  t.plan(3)

  const wstream = new FileTimestampStream({
    path: 'badwrite',
    fs: mockFs
  })

  t.type(wstream.pipe, 'function', 'wstream is stream')

  wstream.on('error', e => {
    t.pass('callback was called')
    t.equal(e.message, 'badwrite', 'error is correct')
    t.end()
  })
  wstream.write(Buffer.from('nevermind'))
})

t.test('Open error for _writev', {timeout: TIMEOUT}, t => {
  t.plan(3)

  const wstream = new FileTimestampStream({
    path: 'badopen',
    fs: mockFs
  })

  t.type(wstream.pipe, 'function', 'wstream is stream')

  wstream._writev([Buffer.from('nevermind')], e => {
    if (e) {
      t.pass('callback was received')
      t.equal(e.message, 'badopen', 'error is correct')
      t.end()
    }
  })
})

t.test('Write error for _writev', {timeout: TIMEOUT}, t => {
  t.plan(3)

  const wstream = new FileTimestampStream({
    path: 'badwrite',
    fs: mockFs
  })

  t.type(wstream.pipe, 'function', 'wstream is stream')

  wstream._writev([Buffer.from('')], e => {
    if (e) {
      t.pass('callback was called')
      t.equal(e.message, 'badwrite', 'error is correct')
      t.end()
    }
  })
})

t.end()
