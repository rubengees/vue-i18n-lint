import { expect, test } from "vitest"
import { formatErrorMessage, ParseError } from "../src/error.ts"

test("formatErrorMessage returns string representation for non-Error values", () => {
  expect(formatErrorMessage("something went wrong")).toStrictEqual("something went wrong")
  expect(formatErrorMessage(42)).toStrictEqual("42")
})

test("formatErrorMessage returns the message for a plain Error", () => {
  expect(formatErrorMessage(new Error("oops"))).toStrictEqual("oops")
})

test("formatErrorMessage chains cause for a plain Error with cause", () => {
  const error = new Error("outer", { cause: new Error("inner") })

  expect(formatErrorMessage(error)).toStrictEqual("outer: inner")
})

test("formatErrorMessage includes the file path for a ParseError", () => {
  const error = new ParseError("failed", "/some/file.ts")

  expect(formatErrorMessage(error)).toContain("file:///some/file.ts")
  expect(formatErrorMessage(error)).toContain("failed")
})

test("formatErrorMessage includes line but not column when only line is given", () => {
  const withLine = formatErrorMessage(new ParseError("failed", "/some/file.ts", { line: 5 }))
  const withLineAndColumn = formatErrorMessage(new ParseError("failed", "/some/file.ts", { line: 5, column: 7 }))

  expect(withLine).toContain("file:///some/file.ts:5")
  expect(withLineAndColumn).toContain("file:///some/file.ts:5:7")
  expect(withLine).not.toContain(":5:7")
})

test("formatErrorMessage chains cause for a ParseError with cause", () => {
  const error = new ParseError("parse failed", "/some/file.ts", { cause: new Error("unexpected token") })

  expect(formatErrorMessage(error)).toContain("parse failed")
  expect(formatErrorMessage(error)).toContain("unexpected token")
})
