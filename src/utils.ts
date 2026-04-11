export function flatten(data: object, prefix: string = ""): string[] {
  return Object.entries(data).flatMap(([key, value]) => {
    if (typeof value === "object") return flatten(value, `${prefix}${key}.`)
    if (typeof value === "string") return [`${prefix}${key}`]
    throw new Error(`Unsupported value type "${typeof value}" at key "${prefix}${key}"`)
  })
}
