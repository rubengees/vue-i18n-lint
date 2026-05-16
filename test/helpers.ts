import { stripVTControlCharacters } from "node:util"
import { expect, vi } from "vitest"

export function expectLogged(text: string) {
  const lines = vi.mocked(console.log).mock.calls.map((args) => stripVTControlCharacters(args[0]?.toString() ?? ""))

  expect(lines).toStrictEqual(expect.arrayContaining([expect.stringContaining(text)]))
}

export function expectErrorLogged(text: string) {
  const lines = vi.mocked(console.error).mock.calls.map((args) => stripVTControlCharacters(args[0]?.toString() ?? ""))

  expect(lines).toStrictEqual(expect.arrayContaining([expect.stringContaining(text)]))
}
