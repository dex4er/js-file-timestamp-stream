/// <reference types="node" />

import * as fs from 'fs'
import { Writable } from 'stream'

export interface Options {
  flags?: string
  fs?: typeof fs
  newFilename?: () => string
  path?: string
}

export class FileTimestampStream extends Writable {
  readonly options: Options

  readonly flags: string
  readonly fs: typeof fs
  readonly newFilename: () => string
  readonly path: string

  currentFilename?: string
  stream?: Writable

  constructor (options?: Options)
}
