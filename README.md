# file-timestamp-stream

<!-- markdownlint-disable MD013 -->
[![Build Status](https://secure.travis-ci.org/dex4er/js-file-timestamp-stream.svg)](http://travis-ci.org/dex4er/js-file-timestamp-stream) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-file-timestamp-stream/badge.svg)](https://coveralls.io/github/dex4er/js-file-timestamp-stream) [![npm](https://img.shields.io/npm/v/file-timestamp-stream.svg)](https://www.npmjs.com/package/file-timestamp-stream)
<!-- markdownlint-enable MD013 -->

This module creates
[stream.Writable](https://nodejs.org/api/stream.html#stream_class_stream_writable)
to a file which is automatically rotated based on current time and uses
[strftime](https://www.npmjs.com/package/strftime) template for file names.

## Requirements

This module requires ES6 with Node >= 6.

## Installation

```shell
npm install file-timestamp-stream
```

_Additionally for Typescript:_

```shell
npm install -D @types/node
```

Transpiling this module with own settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "file-timestamp-stream": ["node_modules/file-timestamp-stream/src/file-timestamp-stream"]
    }
  }
}
```

## Usage

_Example:_

```js
const { FileTimestampStream } = require('file-timestamp-stream')
```

_Typescript:_

```ts
import FileTimestampStream from 'file-timestamp-stream'
```

### Options

* `flags` is a string with
  [flags](https://nodejs.org/api/fs.html#fs_fs_open_path_flags_mode_callback)
  for opened stream (default: `'a'`)
* `fs` is a custom [fs](https://nodejs.org/api/fs.html) module (optional)
* `path` is a template for new filenames (default: `'out.log'`)

_Example:_

Basic path based on `strftime` parameters:

```js
const stream = new FileTimestampStream({
  path: '%Y-%m-%dT%H.log',
  flags: 'a'
})
```

### newFilename

This method can be overriden in subclass.

The method generates a filename for new files. By default it returns new
filename based on path and current time.

_Example:_

```ts
import strftime from 'ultra-strftime'

class MyFileTimestampStream extends FileTimestampStream {
  /** count how many files has been created */
  counter = 0

  // for pure Javascript explicit constructor is necessary
  // constructor (options) { super(options); this.counter = 0 }

  protected newFilename (): string {
    const filename = strftime(this.path)
    if (filename !== this.currentFilename) this.counter++
    return filename
  }
}

const stream = new MyFileTimestampStream({
  path: '%Y-%m-%dT%H:%M.log'
})
```

### Properties

Readonly public properties based on contructor's options:

* `flags`
* `fs`
* `path`

Protected properties for custom subclass:

* `currentFilename` contains last opened filename
* `stream` contains current
  [fs.WriteStream](https://nodejs.org/api/fs.html#fs_class_fs_writestream)
  object

### Path template format

Path can contain [strftime](https://www.npmjs.com/package/strftime) specifiers.

### Warning

This stream have to be closed to free own streams and timers.

## License

Copyright (c) 2017-2018 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)
