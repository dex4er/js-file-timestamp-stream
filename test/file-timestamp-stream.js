'use strict'

process.env.TZ = 'GMT'

var Promise = require('any-promise')
var sleep = require('sleep-promise')
var t = require('tap')

var FileTimestampStream = require('../lib/file-timestamp-stream')
var mockFs = require('../mock/mock-fs')

var TIMEOUT = 2000

t.plan(4)

t.test('Write lines to different files', {timeout: TIMEOUT}, function (t) {
  var wstream, filename1, filename2

  t.plan(6)

  Promise.resolve(true)
  .then(function () {
    wstream = new FileTimestampStream({
      path: '%Y-%m-%dT%H:%M:%S.log',
      flags: 'x',
      fs: mockFs
    })

    t.type(wstream.pipe, 'function', 'wstream is stream')

    wstream.write(Buffer.from('content1\r\n'))
    t.equals(wstream.wstream.content.toString(), 'content1\r\n', 'content is correct')

    filename1 = wstream.wstream.filename
    t.equals(wstream.wstream.options.flags, 'x', 'flags for new file are correct')

    return sleep(1100)
  })
  .then(function () {
    wstream.write(Buffer.from('content2\r\n'))
    t.equals(wstream.wstream.content.toString(), 'content2\r\n', 'content is correct')

    filename2 = wstream.wstream.filename
    t.equals(wstream.wstream.options.flags, 'x', 'flags for new file are correct')
    t.notEqual(filename2, filename1, 'filenames are different')

    t.end()
  })
  .catch(function (err) {
    t.threw(err)
    t.end()
  })
})

t.test('Custom filename generator', {timeout: TIMEOUT}, function (t) {
  t.plan(7)

  var n = 0

  var wstream = new FileTimestampStream({
    newFilename: function () {
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

  wstream.write(Buffer.from('content3\r\n'))
  t.equals(wstream.wstream.content.toString(), 'content3\r\n', 'content is correct')
  t.equals(wstream.wstream.filename, '1.log', 'filename is correct')

  t.end()
})

t.test('_writev', {timeout: TIMEOUT}, function (t) {
  t.plan(7)
  var n = 0

  var wstream = new FileTimestampStream({
    newFilename: function () {
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

  wstream._writev([Buffer.from('G'), Buffer.from('H'), Buffer.from('I')])
  t.equals(wstream.wstream.content.toString(), 'GHI', 'content is correct')
  t.equals(wstream.wstream.filename, '1.log', 'filename is correct')

  t.end()
})

t.test('Default options', {timeout: TIMEOUT}, function (t) {
  t.plan(4)

  var wstream = new FileTimestampStream({
    fs: mockFs
  })

  t.type(wstream.pipe, 'function', 'wstream is stream')

  wstream.write(Buffer.from('content1\r\n'))
  t.equals(wstream.wstream.content.toString(), 'content1\r\n', 'content is correct')
  t.equals(wstream.wstream.filename, 'out.log', 'filename is correct')
  t.equals(wstream.wstream.options.flags, 'a', 'flags for new file are correct')

  t.end()
})

t.end()
