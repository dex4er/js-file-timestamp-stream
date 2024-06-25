import {expect} from "chai"

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps.js"

process.env.TZ = "GMT"

import FileTimestampStream from "../src/file-timestamp-stream.js"
import mockFs, {MockWriteStream} from "./lib/mock-fs.js"

class TestFileTimestampStream extends FileTimestampStream {
  n = 0

  get mockStream(): MockWriteStream {
    return this.stream as any
  }

  newFilename(): string {
    return String(Math.floor(this.n++ / 2)) + ".log"
  }
}

Feature("Test file-timestamp-stream module", () => {
  Scenario("Custom filename generator", () => {
    let wstream: TestFileTimestampStream

    Given("stream created with custom filename generator which uses counter", () => {
      wstream = new TestFileTimestampStream({
        fs: mockFs as any,
      })

      expect(wstream).to.have.property("pipe").that.is.a("function")
    })

    When("I write fist part of content to stream", done => {
      wstream.write(Buffer.from("content1\r\n"), done)
    })

    Then("file contains first part of content", () => {
      expect(wstream.mockStream.content.toString()).to.equal("content1\r\n")
    })

    And("stream has correct filename", () => {
      expect(wstream.mockStream.filename).to.equal("0.log")
    })

    When("I write second part of content to stream", done => {
      wstream.write(Buffer.from("content2\r\n"), done)
    })

    Then("file contains both parts of content", () => {
      expect(wstream.mockStream.content.toString()).to.equal("content1\r\ncontent2\r\n")
    })

    And("stream has unchanged filename", () => {
      expect(wstream.mockStream.filename).to.equal("0.log")
    })

    When("I write third part of content to stream (this time with callback)", done => {
      wstream.write(Buffer.from("content3\r\n"), done)
    })

    Then("file contains only third part of content", () => {
      expect(wstream.mockStream.content.toString()).to.equal("content3\r\n")
    })

    And("stream has new filename", () => {
      expect(wstream.mockStream.filename).to.equal("1.log")
    })

    And("stream can be destroyed", () => {
      if (typeof wstream.destroy === "function") {
        wstream.destroy()
      }
    })
  })
})
