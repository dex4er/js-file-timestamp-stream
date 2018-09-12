import { And, Feature, Given, Scenario, Then, When } from './lib/steps'

process.env.TZ = 'GMT'

import FileTimestampStream from '../src/file-timestamp-stream'
import mockFs, { MockWriteStream } from './lib/mock-fs'

function delay (ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

Feature('Test file-timestamp-stream module', () => {
  Scenario('Write lines to different files', () => {
    let filename1: string
    let filename2: string
    let finished = false
    let wstream: FileTimestampStream

    Given('stream created with %S specifier', () => {
      wstream = new FileTimestampStream({
        path: '%Y-%m-%dT%H:%M:%S.log',
        flags: 'x',
        fs: mockFs as any
      })
      wstream.on('finish', () => {
        finished = true
      })
      wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write first part of content to stream', (done) => {
      wstream.write(Buffer.from('content1\r\n'), done)
    })

    Then('file contains first part of content', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.content.toString().should.equal('content1\r\n')
    })

    And('stream has defined filename', () => {
      const stream: MockWriteStream = wstream.stream as any
      filename1 = stream.filename
      return filename1.should.be.ok
    })

    And('stream has correct flags', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.options.flags!.should.equal('x')
    })

    When('I wait more than one second', () => {
      return delay(1100)
    })

    And('I write second part of content to the same stream', (done) => {
      wstream.write(Buffer.from('content2\r\n'), done)
    })

    Then('file contains second part of content', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.content.toString().should.equal('content2\r\n')
    })

    And('stream has defined another filename', () => {
      const stream: MockWriteStream = wstream.stream as any
      filename2 = stream.filename
      return filename2.should.be.ok
    })

    And('stream has correct flags', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.options.flags!.should.equal('x')
    })

    And('stream has new filename different than previous', () => {
      filename2.should.not.equal(filename1)
    })

    When('I finish stream', (done) => {
      wstream.end(done)
    })

    Then('stream is finished', () => {
      return finished.should.be.true
    })

    And('stream can be destroyed', () => {
      // tslint:disable-next-line:strict-type-predicates
      if (typeof wstream.destroy === 'function') {
        wstream.destroy()
      }
    })
  })

  Scenario('Write corked lines to the same file', () => {
    let filename: string
    let finished = false
    let wstream: FileTimestampStream

    Given('stream created with %S specifier', () => {
      wstream = new FileTimestampStream({
        path: '%Y-%m-%dT%H:%M:%S.log',
        flags: 'x',
        fs: mockFs as any
      })
      wstream.on('finish', () => {
        finished = true
      })
      wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I cork a stream', () => {
      wstream.cork()
    })

    And('I write first part of content to stream', () => {
      wstream.write(Buffer.from('content1\r\n'))
    })

    And('I wait more than one second', () => {
      return delay(1100)
    })

    And('I write second part of content to the same stream', () => {
      wstream.write(Buffer.from('content2\r\n'))
    })

    And('I uncork a stream', () => {
      wstream.uncork()
    })

    And('I flush a stream', (done) => {
      wstream.write('', done)
    })

    Then('file contains all parts of content', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.content.toString().should.equal('content1\r\ncontent2\r\n')
    })

    And('stream has defined filename', () => {
      const stream: MockWriteStream = wstream.stream as any
      filename = stream.filename
      return filename.should.be.ok
    })

    And('stream has correct flags', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.options.flags!.should.equal('x')
    })

    When('I finish stream', (done) => {
      wstream.end(done)
    })

    Then('stream is finished', () => {
      return finished.should.be.true
    })

    And('stream can be destroyed', () => {
      // tslint:disable-next-line:strict-type-predicates
      if (typeof wstream.destroy === 'function') {
        wstream.destroy()
      }
    })
  })

  Scenario('Custom filename generator', () => {
    let n: number
    let wstream: FileTimestampStream

    Given('counter', () => {
      n = 0
    })

    And('stream created with custom filename generator which uses counter', () => {
      wstream = new FileTimestampStream({
        newFilename: () => {
          return Math.floor(n++ / 2) + '.log'
        },
        fs: mockFs as any
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    When('I write fist part of content to stream', (done) => {
      wstream.write(Buffer.from('content1\r\n'), done)
    })

    Then('file contains first part of content', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.content.toString().should.equal('content1\r\n')
    })

    And('stream has correct filename', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.filename.should.equal('0.log')
    })

    When('I write second part of content to stream', (done) => {
      wstream.write(Buffer.from('content2\r\n'), done)
    })

    Then('file contains both parts of content', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.content.toString().should.equal('content1\r\ncontent2\r\n')
    })

    And('stream has unchanged filename', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.filename.should.equal('0.log')
    })

    When('I write third part of content to stream (this time with callback)', (done) => {
      wstream.write(Buffer.from('content3\r\n'), done)
    })

    Then('file contains only third part of content', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.content.toString().should.equal('content3\r\n')
    })

    And('stream has new filename', () => {
      const stream: MockWriteStream = wstream.stream as any
      stream.filename.should.equal('1.log')
    })
  })

  Scenario('Default options', () => {
    let wstream: FileTimestampStream

    Given('stream created with no options', () => {
      wstream = new FileTimestampStream()
      wstream.should.have.property('pipe').that.is.a('function')
    })

    And('stream has the default filename', () => {
      wstream.path.should.equal('out.log')
    })

    Then('stream has the default flags', () => {
      wstream.flags.should.equal('a')
    })
  })

  Scenario('Open error for write', () => {
    let error: Error
    let wstream: FileTimestampStream

    Given('stream with an error on open file', () => {
      wstream = new FileTimestampStream({
        path: 'badopen',
        fs: mockFs as any
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    And('subscription on error event', () => {
      wstream.on('error', (err) => {
        error = err
      })
    })

    When('I try to write something to stream', () => {
      wstream.write(Buffer.from('something'))
    })

    Then("an error was because can't open file", () => {
      error.should.have.property('message').that.equals('badopen')
    })
  })

  Scenario('Write error for write', () => {
    let error: Error
    let wstream: FileTimestampStream

    Given('stream with an error on write to file', () => {
      wstream = new FileTimestampStream({
        path: 'badwrite',
        fs: mockFs as any
      })

      wstream.should.have.property('pipe').that.is.a('function')
    })

    And('subscription on error event', () => {
      wstream.on('error', (err) => {
        error = err
      })
    })

    When('I try to write something to stream', (done) => {
      wstream.write(Buffer.from('something'), () => {
        done()
      })
    })

    Then("an error was because can't write to file", () => {
      error.should.have.property('message').that.equals('badwrite')
    })

    And('stream can be destroyed', () => {
      // tslint:disable-next-line:strict-type-predicates
      if (typeof wstream.destroy === 'function') {
        wstream.destroy()
      }
    })
  })
})
