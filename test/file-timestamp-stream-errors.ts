import {expect} from "chai"

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps.js"

process.env.TZ = "GMT"

import FileTimestampStream from "../src/file-timestamp-stream.js"
import mockFs from "./lib/mock-fs.js"

Feature("Test file-timestamp-stream module", () => {
  Scenario("Open error for write", () => {
    let error: Error
    let wstream: FileTimestampStream

    Given("stream with an error on open file", () => {
      wstream = new FileTimestampStream({
        path: "badopen",
        fs: mockFs as any,
      })

      expect(wstream).to.have.property("pipe").that.is.a("function")
    })

    And("subscription on error event", () => {
      wstream.on("error", err => {
        error = err
      })
    })

    When("I try to write something to stream", () => {
      wstream.write(Buffer.from("something"))
    })

    Then("an error was because can't open file", () => {
      expect(error).to.have.property("message").that.equals("badopen")
    })
  })

  Scenario("Write error for write", () => {
    let error: Error
    let wstream: FileTimestampStream

    Given("stream with an error on write to file", () => {
      wstream = new FileTimestampStream({
        path: "badwrite",
        fs: mockFs as any,
      })

      expect(wstream).to.have.property("pipe").that.is.a("function")
    })

    And("subscription on error event", () => {
      wstream.on("error", err => {
        error = err
      })
    })

    When("I try to write something to stream", () => {
      wstream.write(Buffer.from("something"))
    })

    Then("an error was because can't write to file", () => {
      expect(error).to.have.property("message").that.equals("badwrite")
    })

    And("stream can be destroyed", () => {
      if (typeof wstream.destroy === "function") {
        wstream.destroy()
      }
    })
  })
})
