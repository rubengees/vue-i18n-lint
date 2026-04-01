import { collectFileKeys } from "../collector/fileCollector.ts"
import type { FileKey } from "../types.ts"

export default function (filePath: string): FileKey[] {
  return collectFileKeys(filePath)
}
