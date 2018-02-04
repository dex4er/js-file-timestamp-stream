/// <reference types="node" />

import fs from 'fs'
import { Writable } from 'stream'

export interface FileTimestampStreamOptions {
  flags?: string
  fs?: typeof fs
  newFilename?: () => string
  path?: string
}

export class FileTimestampStream extends Writable {
  readonly options: FileTimestampStreamOptions

  readonly flags: string
  readonly fs: typeof fs
  readonly newFilename: () => string
  readonly path: string

  currentFilename?: string
  stream?: Writable

  constructor (options?: FileTimestampStreamOptions)
}

export default FileTimestampStream
