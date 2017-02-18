'use strict'

process.env.TZ = 'GMT'

const sleep = require('sleep-promise')
const t = require('tap')

const FileTimestampStream = require('../lib/file-timestamp-stream')
const mockFs = require('../mock/mock-fs')

/* eslint-env mocha */
t.mochaGlobals()
require('chai').should()
const scenario = context
const given = (what, how) => { return it('Given ' + what, how) }
const when = (what, how) => { return it('When ' + what, how) }
const then = (what, how) => { return it('Then ' + what, how) }

scenario('Write lines to different files', function () {
  given('stream created with %S specifier', () => {
    this.wstream = new FileTimestampStream({
      path: '%Y-%m-%dT%H:%M:%S.log',
      flags: 'x',
      fs: mockFs
    })

    this.wstream.should.have.property('pipe').that.is.a('function')
  })

  when('I write first part of content to stream', () => {
    this.wstream.write(Buffer.from('content1\r\n'))
  })

  then('file contains first part of content', () => {
    this.wstream.wstream.content.toString().should.equal('content1\r\n')
  })

  then('stream has defined filename', () => {
    this.filename1 = this.wstream.wstream.filename
    this.filename1.should.be.ok
  })

  then('stream has correct flags', () => {
    this.wstream.wstream.options.flags.should.equal('x')
  })

  when('I wait more than one second', () => {
    return sleep(1100)
  })

  when('I write second part of content to the same stream', () => {
    this.wstream.write(Buffer.from('content2\r\n'))
  })

  then('file contains second part of content', () => {
    this.wstream.wstream.content.toString().should.equal('content2\r\n')
  })

  then('stream has defined another filename', () => {
    this.filename2 = this.wstream.wstream.filename
    this.filename2.should.be.ok
  })

  then('stream has correct flags', () => {
    this.wstream.wstream.options.flags.should.equal('x')
  })

  then('stream has new filename different than previous', () => {
    this.filename2.should.not.equal(this.filename1)
  })
})

scenario('Custom filename generator', function () {
  given('counter', () => {
    this.n = 0
  })

  given('stream created with custom filename generator which uses counter', () => {
    this.wstream = new FileTimestampStream({
      newFilename: () => {
        return Math.floor(this.n++ / 2) + '.log'
      },
      fs: mockFs
    })

    this.wstream.should.have.property('pipe').that.is.a('function')
  })

  when('I write fist part of content to stream', () => {
    this.wstream.write(Buffer.from('content1\r\n'))
  })

  then('file contains first part of content', () => {
    this.wstream.wstream.content.toString().should.equal('content1\r\n')
  })

  then('stream has correct filename', () => {
    this.wstream.wstream.filename.should.equal('0.log')
  })

  when('I write second part of content to stream', () => {
    this.wstream.write(Buffer.from('content2\r\n'))
  })

  then('file contains both parts of content', () => {
    this.wstream.wstream.content.toString().should.equal('content1\r\ncontent2\r\n')
  })

  then('stream has unchanged filename', () => {
    this.wstream.wstream.filename.should.equal('0.log')
  })

  when('I write third part of content to stream (this time with callback)', done => {
    this.wstream.write(Buffer.from('content3\r\n'), done)
  })

  then('file contains only third part of content', () => {
    this.wstream.wstream.content.toString().should.equal('content3\r\n')
  })

  then('stream has new filename', () => {
    this.wstream.wstream.filename.should.equal('1.log')
  })
})

scenario('Use _writev method directly', function () {
  given('counter', () => {
    this.n = 0
  })

  given('stream created with custom filename generator which uses counter', () => {
    this.wstream = new FileTimestampStream({
      newFilename: () => {
        return Math.floor(this.n++ / 2) + '.log'
      },
      fs: mockFs
    })

    this.wstream.should.have.property('pipe').that.is.a('function')
  })

  when('I write first 3 bytes to stream', () => {
    this.wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')])
  })

  then('file contains first 3 bytes', () => {
    this.wstream.wstream.content.toString().should.equal('ABC')
  })

  then('stream has unchanged filename', () => {
    this.wstream.wstream.filename.should.equal('0.log')
  })

  when('I write next 3 bytes to stream', () => {
    this.wstream._writev([Buffer.from('D'), Buffer.from('E'), Buffer.from('F')])
  })

  then('file contains first 6 bytes', () => {
    this.wstream.wstream.content.toString().should.equal('ABCDEF')
  })

  then('stream has unchanged name', () => {
    this.wstream.wstream.filename.should.equal('0.log')
  })

  when('I write last 3 bytes to stream (this time with callback)', done => {
    this.wstream._writev([Buffer.from('G'), Buffer.from('H'), Buffer.from('I')], done)
  })

  then('file contains last 3 bytes', () => {
    this.wstream.wstream.content.toString().should.equal('GHI')
  })

  then('stream has new filename', () => {
    this.wstream.wstream.filename.should.equal('1.log')
  })
})

scenario('Default options', function () {
  given('stream created with no options but overriden fs property', () => {
    this.wstream = new FileTimestampStream()
    this.wstream.fs = mockFs

    this.wstream.should.have.property('pipe').that.is.a('function')
  })

  when('I write fist part of content to stream', () => {
    this.wstream.write(Buffer.from('content1\r\n'))
  })

  then('file contains first part of content', () => {
    this.wstream.wstream.content.toString().should.equal('content1\r\n')
  })

  then('stream has the default filename', () => {
    this.wstream.wstream.filename.should.equal('out.log')
  })

  then('stream has the default flags', () => {
    this.wstream.wstream.options.flags.should.equal('a')
  })
})

scenario('Open error for _write', function () {
  given('stream with an error on open file', () => {
    this.wstream = new FileTimestampStream({
      path: 'badopen',
      fs: mockFs
    })

    this.wstream.should.have.property('pipe').that.is.a('function')
  })

  given('subscription on error event', () => {
    this.wstream.on('error', e => {
      this.error = e
    })
  })

  when('I write something to stream', () => {
    this.wstream.write(Buffer.from('something'))
  })

  then("an error was because can't open file", () => {
    this.error.should.have.property('message').that.equals('badopen')
  })
})

scenario('Write error for _write', function () {
  given('stream with an error on write to file', () => {
    this.wstream = new FileTimestampStream({
      path: 'badwrite',
      fs: mockFs
    })

    this.wstream.should.have.property('pipe').that.is.a('function')
  })

  given('subscription on error event', () => {
    this.wstream.on('error', e => {
      this.error = e
    })
  })

  when('I write something to stream', () => {
    this.wstream.write(Buffer.from('something'))
  })

  then("an error was because can't write to file", () => {
    this.error.should.have.property('message').that.equals('badwrite')
  })
})

scenario('Open error for _writev', function () {
  given('stream with an error on open file', () => {
    this.wstream = new FileTimestampStream({
      path: 'badopen',
      fs: mockFs
    })

    this.wstream.should.have.property('pipe').that.is.a('function')
  })

  given('callback for _writev', () => {
    this.callback = e => {
      if (e) {
        this.error = e
      }
    }
  })

  when('I write some bytes to stream', () => {
    this.wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')], this.callback)
  })

  then("an error was because can't open file", () => {
    this.error.should.have.property('message').that.equals('badopen')
  })
})

scenario('Write error for _writev', function () {
  given('stream with an error on write to file', () => {
    this.wstream = new FileTimestampStream({
      path: 'badwrite',
      fs: mockFs
    })

    this.wstream.should.have.property('pipe').that.is.a('function')
  })

  given('callback for _writev', () => {
    this.callback = e => {
      if (e) {
        this.error = e
      }
    }
  })

  when('I write some bytes to stream', () => {
    this.wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')], this.callback)
  })

  then("an error was because can't write to file", () => {
    this.error.should.have.property('message').that.equals('badwrite')
  })
})
