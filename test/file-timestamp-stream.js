'use strict'

process.env.TZ = 'GMT'

const delay = require('delay')

const FileTimestampStream = require('../lib/file-timestamp-stream').FileTimestampStream
const mockFs = require('../mock/mock-fs')

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.should()

Feature('Test file-timestamp-stream module', () => {
  Scenario('Write lines to different files', () => {
    let filename1
    let filename2
    let wstream

    Given('stream created with %S specifier', () => {
      wstream = new FileTimestampStream({
        path: '%Y-%m-%dT%H:%M:%S.log',
        flags: 'x',
        fs: mockFs
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write first part of content to stream', () => {
      wstream.write(Buffer.from('content1\r\n'))
    })

    Then('file contains first part of content', () => {
      wstream.stream.content.toString().should.equal('content1\r\n')
    })

    And('stream has defined filename', () => {
      filename1 = wstream.stream.filename
      return filename1.should.be.ok
    })

    And('stream has correct flags', () => {
      wstream.stream.options.flags.should.equal('x')
    })

    When('I wait more than one second', () => {
      return delay(1100)
    })

    And('I write second part of content to the same stream', () => {
      wstream.write(Buffer.from('content2\r\n'))
    })

    Then('file contains second part of content', () => {
      wstream.stream.content.toString().should.equal('content2\r\n')
    })

    And('stream has defined another filename', () => {
      filename2 = wstream.stream.filename
      return filename2.should.be.ok
    })

    And('stream has correct flags', () => {
      wstream.stream.options.flags.should.equal('x')
    })

    And('stream has new filename different than previous', () => {
      filename2.should.not.equal(filename1)
    })
  })

  Scenario('Custom filename generator', () => {
    let n
    let wstream

    Given('counter', () => {
      n = 0
    })

    And('stream created with custom filename generator which uses counter', () => {
      wstream = new FileTimestampStream({
        newFilename: () => {
          return Math.floor(n++ / 2) + '.log'
        },
        fs: mockFs
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write fist part of content to stream', () => {
      wstream.write(Buffer.from('content1\r\n'))
    })

    Then('file contains first part of content', () => {
      wstream.stream.content.toString().should.equal('content1\r\n')
    })

    And('stream has correct filename', () => {
      wstream.stream.filename.should.equal('0.log')
    })

    When('I write second part of content to stream', () => {
      wstream.write(Buffer.from('content2\r\n'))
    })

    Then('file contains both parts of content', () => {
      wstream.stream.content.toString().should.equal('content1\r\ncontent2\r\n')
    })

    And('stream has unchanged filename', () => {
      wstream.stream.filename.should.equal('0.log')
    })

    When('I write third part of content to stream (this time with callback)', done => {
      wstream.write(Buffer.from('content3\r\n'), done)
    })

    Then('file contains only third part of content', () => {
      wstream.stream.content.toString().should.equal('content3\r\n')
    })

    And('stream has new filename', () => {
      wstream.stream.filename.should.equal('1.log')
    })
  })

  Scenario('Use _writev method directly', () => {
    let n
    let wstream

    Given('counter', () => {
      n = 0
    })

    And('stream created with custom filename generator which uses counter', () => {
      wstream = new FileTimestampStream({
        newFilename: () => {
          return Math.floor(n++ / 2) + '.log'
        },
        fs: mockFs
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write first 3 bytes to stream', () => {
      wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')])
    })

    Then('file contains first 3 bytes', () => {
      wstream.stream.content.toString().should.equal('ABC')
    })

    And('stream has unchanged filename', () => {
      wstream.stream.filename.should.equal('0.log')
    })

    When('I write next 3 bytes to stream', () => {
      wstream._writev([Buffer.from('D'), Buffer.from('E'), Buffer.from('F')])
    })

    Then('file contains first 6 bytes', () => {
      wstream.stream.content.toString().should.equal('ABCDEF')
    })

    And('stream has unchanged name', () => {
      wstream.stream.filename.should.equal('0.log')
    })

    When('I write last 3 bytes to stream (this time with callback)', done => {
      wstream._writev([Buffer.from('G'), Buffer.from('H'), Buffer.from('I')], done)
    })

    Then('file contains last 3 bytes', () => {
      wstream.stream.content.toString().should.equal('GHI')
    })

    And('stream has new filename', () => {
      wstream.stream.filename.should.equal('1.log')
    })
  })

  Scenario('Default options', () => {
    let wstream

    Given('stream created with no options but overriden fs property', () => {
      wstream = new FileTimestampStream()
      wstream.fs = mockFs

      wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write fist part of content to stream', () => {
      wstream.write(Buffer.from('content1\r\n'))
    })

    Then('file contains first part of content', () => {
      wstream.stream.content.toString().should.equal('content1\r\n')
    })

    And('stream has the default filename', () => {
      wstream.stream.filename.should.equal('out.log')
    })

    Then('stream has the default flags', () => {
      wstream.stream.options.flags.should.equal('a')
    })
  })

  Scenario('Open error for _write', () => {
    let error
    let wstream

    Given('stream with an error on open file', () => {
      wstream = new FileTimestampStream({
        path: 'badopen',
        fs: mockFs
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    And('subscription on error event', () => {
      wstream.on('error', e => {
        error = e
      })
    })

    When('I write something to stream', () => {
      wstream.write(Buffer.from('something'))
    })

    Then("an error was because can't open file", () => {
      error.should.have.property('message').that.equals('badopen')
    })
  })

  Scenario('Write error for _write', () => {
    let error
    let wstream

    Given('stream with an error on write to file', () => {
      wstream = new FileTimestampStream({
        path: 'badwrite',
        fs: mockFs
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    And('subscription on error event', () => {
      wstream.on('error', e => {
        error = e
      })
    })

    When('I write something to stream', () => {
      wstream.write(Buffer.from('something'))
    })

    Then("an error was because can't write to file", () => {
      error.should.have.property('message').that.equals('badwrite')
    })
  })

  Scenario('Open error for _writev', () => {
    let callback
    let error
    let wstream

    Given('stream with an error on open file', () => {
      wstream = new FileTimestampStream({
        path: 'badopen',
        fs: mockFs
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    And('callback for _writev', () => {
      callback = e => {
        if (e) {
          error = e
        }
      }
    })

    When('I write some bytes to stream', () => {
      wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')], callback)
    })

    Then("an error was because can't open file", () => {
      error.should.have.property('message').that.equals('badopen')
    })
  })

  Scenario('Write error for _writev', function () {
    let callback
    let error
    let wstream

    Given('stream with an error on write to file', () => {
      wstream = new FileTimestampStream({
        path: 'badwrite',
        fs: mockFs
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    And('callback for _writev', () => {
      callback = e => {
        if (e) {
          error = e
        }
      }
    })

    When('I write some bytes to stream', () => {
      wstream._writev([Buffer.from('A'), Buffer.from('B'), Buffer.from('C')], callback)
    })

    Then("an error was because can't write to file", () => {
      error.should.have.property('message').that.equals('badwrite')
    })
  })
})
