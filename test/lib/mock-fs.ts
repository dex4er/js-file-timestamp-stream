import { Writable, WritableOptions } from 'stream'

import { FileTimestampStreamOptions } from '../../src/file-timestamp-stream'

export class MockWriteStream extends Writable {
  content = Buffer.alloc(0)

  constructor (public filename: string, public options: FileTimestampStreamOptions) {
    super()
  }

  _write (chunk: any, _encoding: string, callback: (error?: Error | null) => void): void {
    if (this.filename === 'badwrite') {
      callback(new Error('badwrite'))
    } else {
      this.content = Buffer.concat([this.content, chunk])
      callback()
    }
  }
}

export function createWriteStream (filename: string, options: WritableOptions): MockWriteStream {
  if (filename === 'badopen') {
    throw new Error('badopen')
  } else {
    return new MockWriteStream(filename, options)
  }
}

const mockFs = {
  createWriteStream
}

export default mockFs
