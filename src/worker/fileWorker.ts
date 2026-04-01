import { collectFileKeys } from "../collector/fileCollector.ts"
import type { FileKey } from "../types.ts"

export default function (filePaths: string[]): FileKey[] {
  return filePaths.flatMap((filePath) => collectFileKeys(filePath))
}
