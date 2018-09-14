import { And, Feature, Given, Scenario, Then, When } from './lib/steps'

process.env.TZ = 'GMT'

import FileTimestampStream from '../src/file-timestamp-stream'
import mockFs, { MockWriteStream } from './lib/mock-fs'

function delay (ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

class TestFileTimestampStream extends FileTimestampStream {
  get mockStream (): MockWriteStream {
    return this.stream as any
  }
}

Feature('Test file-timestamp-stream module', () => {
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

  Scenario('Write lines to different files', () => {
    let filename1: string
    let filename2: string
    let finished = false
    let wstream: TestFileTimestampStream

    Given('stream created with %S specifier', () => {
      wstream = new TestFileTimestampStream({
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
      wstream.mockStream.content.toString().should.equal('content1\r\n')
    })

    And('stream has defined filename', () => {
      filename1 = wstream.mockStream.filename
      return filename1.should.be.ok
    })

    And('stream has correct flags', () => {
      wstream.mockStream.options.flags!.should.equal('x')
    })

    When('I wait more than one second', () => {
      return delay(1100)
    })

    And('I write second part of content to the same stream', (done) => {
      wstream.write(Buffer.from('content2\r\n'), done)
    })

    Then('file contains second part of content', () => {
      wstream.mockStream.content.toString().should.equal('content2\r\n')
    })

    And('stream has defined another filename', () => {
      filename2 = wstream.mockStream.filename
      return filename2.should.be.ok
    })

    And('stream has correct flags', () => {
      wstream.mockStream.options.flags!.should.equal('x')
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
    let wstream: TestFileTimestampStream

    Given('stream created with %S specifier', () => {
      wstream = new TestFileTimestampStream({
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
      wstream.mockStream.content.toString().should.equal('content1\r\ncontent2\r\n')
    })

    And('stream has defined filename', () => {
      filename = wstream.mockStream.filename
      return filename.should.be.ok
    })

    And('stream has correct flags', () => {
      wstream.mockStream.options.flags!.should.equal('x')
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
})
