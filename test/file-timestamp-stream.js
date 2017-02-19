'use strict'

process.env.TZ = 'GMT'

const sleep = require('sleep-promise')

const FileTimestampStream = require('../lib/file-timestamp-stream')
const mockFs = require('../mock/mock-fs')

/* global Feature, Scenario, Given, When, Then */
const t = require('tap')
require('tap-given')(t)
require('chai').should()

Feature('Test file-timestamp-stream module', () => {
  Scenario('Write lines to different files', function () {
    Given('stream created with %S specifier', () => {
      this.wstream = new FileTimestampStream({
        path: '%Y-%m-%dT%H:%M:%S.log',
        flags: 'x',
        fs: mockFs
      })

      this.wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write first part of content to stream', () => {
      this.wstream.write(Buffer.from('content1\r\n'))
    })

    Then('file contains first part of content', () => {
      this.wstream.wstream.content.toString().should.equal('content1\r\n')
    })

    Then('stream has defined filename', () => {
      this.filename1 = this.wstream.wstream.filename
      this.filename1.should.be.ok
    })

    Then('stream has correct flags', () => {
      this.wstream.wstream.options.flags.should.equal('x')
    })

    When('I wait more than one second', () => {
      return sleep(1100)
    })

    When('I write second part of content to the same stream', () => {
      this.wstream.write(Buffer.from('content2\r\n'))
    })

    Then('file contains second part of content', () => {
      this.wstream.wstream.content.toString().should.equal('content2\r\n')
    })

    Then('stream has defined another filename', () => {
      this.filename2 = this.wstream.wstream.filename
      this.filename2.should.be.ok
    })

    Then('stream has correct flags', () => {
      this.wstream.wstream.options.flags.should.equal('x')
    })

    Then('stream has new filename different than previous', () => {
      this.filename2.should.not.equal(this.filename1)
    })
  })

  Scenario('Custom filename generator', function () {
    Given('counter', () => {
      this.n = 0
    })

    Given('stream created with custom filename generator which uses counter', () => {
      this.wstream = new FileTimestampStream({
        newFilename: () => {
          return Math.floor(this.n++ / 2) + '.log'
        },
        fs: mockFs
      })

      this.wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write fist part of content to stream', () => {
      this.wstream.write(Buffer.from('content1\r\n'))
    })

    Then('file contains first part of content', () => {
      this.wstream.wstream.content.toString().should.equal('content1\r\n')
    })

    Then('stream has correct filename', () => {
      this.wstream.wstream.filename.should.equal('0.log')
    })

    When('I write second part of content to stream', () => {
      this.wstream.write(Buffer.from('content2\r\n'))
    })

    Then('file contains both parts of content', () => {
      this.wstream.wstream.content.toString().should.equal('content1\r\ncontent2\r\n')
    })

    Then('stream has unchanged filename', () => {
      this.wstream.wstream.filename.should.equal('0.log')
    })

    When('I write third part of content to stream (this time with callback)', done => {
      this.wstream.write(Buffer.from('content3\r\n'), done)
    })

    Then('file contains only third part of content', () => {
      this.wstream.wstream.content.toString().should.equal('content3\r\n')
    })

    Then('stream has new filename', () => {
      this.wstream.wstream.filename.should.equal('1.log')
    })
  })

  Scenario('Use _writev method directly', function () {
    Given('counter', () => {
      this.n = 0
    })

    Given('stream created with custom filename generator which uses counter', () => {
      this.wstream = new FileTimestampStream({
        newFilename: () => {
          return Math.floor(this.n++ / 2) + '.log'
        },
        fs: mockFs
      })

      this.wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write first 3 bytes to stream', () => {
      this.wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')])
    })

    Then('file contains first 3 bytes', () => {
      this.wstream.wstream.content.toString().should.equal('ABC')
    })

    Then('stream has unchanged filename', () => {
      this.wstream.wstream.filename.should.equal('0.log')
    })

    When('I write next 3 bytes to stream', () => {
      this.wstream._writev([Buffer.from('D'), Buffer.from('E'), Buffer.from('F')])
    })

    Then('file contains first 6 bytes', () => {
      this.wstream.wstream.content.toString().should.equal('ABCDEF')
    })

    Then('stream has unchanged name', () => {
      this.wstream.wstream.filename.should.equal('0.log')
    })

    When('I write last 3 bytes to stream (this time with callback)', done => {
      this.wstream._writev([Buffer.from('G'), Buffer.from('H'), Buffer.from('I')], done)
    })

    Then('file contains last 3 bytes', () => {
      this.wstream.wstream.content.toString().should.equal('GHI')
    })

    Then('stream has new filename', () => {
      this.wstream.wstream.filename.should.equal('1.log')
    })
  })

  Scenario('Default options', function () {
    Given('stream created with no options but overriden fs property', () => {
      this.wstream = new FileTimestampStream()
      this.wstream.fs = mockFs

      this.wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write fist part of content to stream', () => {
      this.wstream.write(Buffer.from('content1\r\n'))
    })

    Then('file contains first part of content', () => {
      this.wstream.wstream.content.toString().should.equal('content1\r\n')
    })

    Then('stream has the default filename', () => {
      this.wstream.wstream.filename.should.equal('out.log')
    })

    Then('stream has the default flags', () => {
      this.wstream.wstream.options.flags.should.equal('a')
    })
  })

  Scenario('Open error for _write', function () {
    Given('stream with an error on open file', () => {
      this.wstream = new FileTimestampStream({
        path: 'badopen',
        fs: mockFs
      })

      this.wstream.should.have.property('pipe').that.is.a('function')
    })

    Given('subscription on error event', () => {
      this.wstream.on('error', e => {
        this.error = e
      })
    })

    When('I write something to stream', () => {
      this.wstream.write(Buffer.from('something'))
    })

    Then("an error was because can't open file", () => {
      this.error.should.have.property('message').that.equals('badopen')
    })
  })

  Scenario('Write error for _write', function () {
    Given('stream with an error on write to file', () => {
      this.wstream = new FileTimestampStream({
        path: 'badwrite',
        fs: mockFs
      })

      this.wstream.should.have.property('pipe').that.is.a('function')
    })

    Given('subscription on error event', () => {
      this.wstream.on('error', e => {
        this.error = e
      })
    })

    When('I write something to stream', () => {
      this.wstream.write(Buffer.from('something'))
    })

    Then("an error was because can't write to file", () => {
      this.error.should.have.property('message').that.equals('badwrite')
    })
  })

  Scenario('Open error for _writev', function () {
    Given('stream with an error on open file', () => {
      this.wstream = new FileTimestampStream({
        path: 'badopen',
        fs: mockFs
      })

      this.wstream.should.have.property('pipe').that.is.a('function')
    })

    Given('callback for _writev', () => {
      this.callback = e => {
        if (e) {
          this.error = e
        }
      }
    })

    When('I write some bytes to stream', () => {
      this.wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')], this.callback)
    })

    Then("an error was because can't open file", () => {
      this.error.should.have.property('message').that.equals('badopen')
    })
  })

  Scenario('Write error for _writev', function () {
    Given('stream with an error on write to file', () => {
      this.wstream = new FileTimestampStream({
        path: 'badwrite',
        fs: mockFs
      })

      this.wstream.should.have.property('pipe').that.is.a('function')
    })

    Given('callback for _writev', () => {
      this.callback = e => {
        if (e) {
          this.error = e
        }
      }
    })

    When('I write some bytes to stream', () => {
      this.wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')], this.callback)
    })

    Then("an error was because can't write to file", () => {
      this.error.should.have.property('message').that.equals('badwrite')
    })
  })
})
