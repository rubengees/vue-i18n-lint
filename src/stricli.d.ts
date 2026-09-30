import type { Writable } from "node:stream"

// Stricli defines a narrow interface for stdout and stderr, which is inconvenient for us.
// Change the type to proper Writable instances.
declare module "@stricli/core" {
  interface StricliProcess {
    readonly stdout: Writable
    readonly stderr: Writable
  }
}
