import chai, {expect} from "chai"

import dirtyChai from "dirty-chai"
chai.use(dirtyChai)

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps"

process.env.TZ = "GMT"

import FileTimestampStream from "../src/file-timestamp-stream"
import mockFs, {MockWriteStream} from "./lib/mock-fs"

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

class TestFileTimestampStream extends FileTimestampStream {
  get mockStream(): MockWriteStream {
    return this.stream as any
  }
}

Feature("Test file-timestamp-stream module", () => {
  Scenario("Default options", () => {
    let wstream: FileTimestampStream

    Given("stream created with no options", () => {
      wstream = new FileTimestampStream()
      expect(wstream)
        .to.have.property("pipe")
        .that.is.a("function")
    })

    And("stream has the default filename", () => {
      expect(wstream.path).to.equal("out.log")
    })

    Then("stream has the default flags", () => {
      expect(wstream.flags).to.equal("a")
    })
  })

  Scenario("Write lines to different files", () => {
    let filename1: string
    let filename2: string
    let finished = false
    let wstream: TestFileTimestampStream

    Given("stream created with %S specifier", () => {
      wstream = new TestFileTimestampStream({
        path: "%Y-%m-%dT%H:%M:%S.log",
        flags: "x",
        fs: mockFs as any,
      })
      wstream.on("finish", () => {
        finished = true
      })
      expect(wstream)
        .to.have.property("pipe")
        .that.is.a("function")
    })

    When("I write first part of content to stream", done => {
      wstream.write(Buffer.from("content1\r\n"), done)
    })

    Then("file contains first part of content", () => {
      expect(wstream.mockStream.content.toString()).to.equal("content1\r\n")
    })

    And("stream has defined filename", () => {
      filename1 = wstream.mockStream.filename
      expect(filename1).to.be.ok()
    })

    And("stream has correct flags", () => {
      expect(wstream.mockStream.options.flags).to.equal("x")
    })

    When("I wait more than one second", () => {
      return delay(1100)
    })

    And("I write second part of content to the same stream", done => {
      wstream.write(Buffer.from("content2\r\n"), done)
    })

    Then("file contains second part of content", () => {
      expect(wstream.mockStream.content.toString()).to.equal("content2\r\n")
    })

    And("stream has defined another filename", () => {
      filename2 = wstream.mockStream.filename
      expect(filename2).to.be.ok()
    })

    And("stream has correct flags", () => {
      expect(wstream.mockStream.options.flags).to.equal("x")
    })

    And("stream has new filename different than previous", () => {
      expect(filename2).to.not.equal(filename1)
    })

    When("I finish stream", done => {
      wstream.end(done)
    })

    Then("stream is finished", () => {
      expect(finished).to.be.true()
    })

    And("stream can be destroyed", () => {
      if (typeof wstream.destroy === "function") {
        wstream.destroy()
      }
    })
  })

  Scenario("Write corked lines to the same file", () => {
    let filename: string
    let finished = false
    let wstream: TestFileTimestampStream

    Given("stream created with %S specifier", () => {
      wstream = new TestFileTimestampStream({
        path: "%Y-%m-%dT%H:%M:%S.log",
        flags: "x",
        fs: mockFs as any,
      })
      wstream.on("finish", () => {
        finished = true
      })
      expect(wstream)
        .to.have.property("pipe")
        .that.is.a("function")
    })

    When("I cork a stream", () => {
      wstream.cork()
    })

    And("I write first part of content to stream", () => {
      wstream.write(Buffer.from("content1\r\n"))
    })

    And("I wait more than one second", () => {
      return delay(1100)
    })

    And("I write second part of content to the same stream", () => {
      wstream.write(Buffer.from("content2\r\n"))
    })

    And("I uncork a stream", () => {
      wstream.uncork()
    })

    And("I flush a stream", done => {
      wstream.write("", done)
    })

    Then("file contains all parts of content", () => {
      expect(wstream.mockStream.content.toString()).to.equal("content1\r\ncontent2\r\n")
    })

    And("stream has defined filename", () => {
      filename = wstream.mockStream.filename
      expect(filename).to.be.ok()
    })

    And("stream has correct flags", () => {
      expect(wstream.mockStream.options.flags).to.equal("x")
    })

    When("I finish stream", done => {
      wstream.end(done)
    })

    Then("stream is finished", () => {
      expect(finished).to.be.true()
    })

    And("stream can be destroyed", () => {
      if (typeof wstream.destroy === "function") {
        wstream.destroy()
      }
    })
  })
})
