import type { LocaleKey } from "../types.ts"

export function extractLocaleKeys(data: object, prefix: string = ""): LocaleKey[] {
  return Object.entries(data).flatMap(([key, value]) => {
    if (typeof value === "object") {
      if (value === null) return { key: `${prefix}${key}`, type: "null" }

      return extractLocaleKeys(value, `${prefix}${key}.`)
    }

    return { key: `${prefix}${key}`, type: typeof value }
  })
}
