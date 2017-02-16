## file-timestamp-stream

[![Build Status](https://secure.travis-ci.org/dex4er/js-file-timestamp-stream.svg)](http://travis-ci.org/dex4er/js-file-timestamp-stream) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-file-timestamp-stream/badge.svg)](https://coveralls.io/github/dex4er/js-file-timestamp-stream) [![npm](https://img.shields.io/npm/v/file-timestamp-stream.svg)](https://www.npmjs.com/package/file-timestamp-stream)

This module creates [stream.Writable](https://nodejs.org/api/stream.html#stream_class_stream_writable) to a file which is automatically rotated based on current time.

### Installation

```shell
npm install file-timestamp-stream
```

### Usage

```js
const FileTimestampStream = require('file-timestamp-stream')

const stream = new FileTimestampStream({
  path: '%Y-%m-%dT%H.log',
  flags: 'a'
})
```

#### Options:

* newFilename is a custom function which returns new filename (default: returns new filename based on path and current time)
* flags is a string with [flags](https://nodejs.org/api/fs.html#fs_fs_open_path_flags_mode_callback) for opened stream (default: 'a')
* fs is a custom [fs](https://nodejs.org/api/fs.html) module (optional)
* path is a template for new filenames (default: 'out.log')

#### Path template format:

Path can contain [strftime](https://www.npmjs.com/package/strftime)'s specifiers.

### License

Copyright (c) 2017 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[Artistic License 2.0](https://opensource.org/licenses/Artistic-2.0)
