import { stripVTControlCharacters } from "node:util"
import { expect, vi } from "vitest"

export function expectLogged(text: string) {
  const lines = vi.mocked(console.log).mock.calls.map((args) => stripVTControlCharacters(args.join(" ")))

  if (lines.length === 1) {
    expect(lines[0]).toContain(text)
  } else {
    expect(lines).toStrictEqual(expect.arrayContaining([expect.stringContaining(text)]))
  }
}

export function expectNotLogged(text: string) {
  const lines = vi.mocked(console.log).mock.calls.map((args) => stripVTControlCharacters(args.join(" ")))

  if (lines.length === 1) {
    expect(lines[0]).not.toContain(text)
  } else {
    expect(lines).not.toStrictEqual(expect.arrayContaining([expect.stringContaining(text)]))
  }
}

export function expectErrorLogged(text: string) {
  const lines = vi.mocked(console.error).mock.calls.map((args) => stripVTControlCharacters(args.join(" ")))

  if (lines.length === 1) {
    expect(lines[0]).toContain(text)
  } else {
    expect(lines).toStrictEqual(expect.arrayContaining([expect.stringContaining(text)]))
  }
}
