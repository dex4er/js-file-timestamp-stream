# Changelog

## v3.0.0 2024-06-26

- Converted to ESM module.
- Requires Node >= 16.
- Uses timers-obj@3.
- Unref timers so they don't block the event loop.

## v2.2.4 2019-10-07

- Compatible with newer NodeJS typings.
- Use `mocha-steps` for testing.
- Updated dependencies.

## v2.2.3 2019-07-10

- Updated dependencies.

## v2.2.2 2019-07-08

- Updated dependencies.

## v2.2.1 2019-06-25

- Minor refactoring.

## v2.2.0 2019-06-17

- Closer's timer is `unref`-ed to prevent holding a NodeJS runtime.

## v2.1.4 2019-06-04

- Minor tweaks in README.
- Added source map to the package.

## v2.1.3 2019-05-08

- Updated dependencies.

## v2.1.2 2018-09-18

- Use stream.finished@1.1.1 with Typescript support.

## v2.1.1 2018-09-17

- Do not use `timers-obj` as far as pure NodeJS timers have better support for
  debugging.

## v2.1.0 2018-09-17

- Close file if its file name is already changed even if there is no new data
  written: this check is made by interval timer.

## v2.0.0 2018-09-14

- `newFilename` should be overriden in subclass so it is no argument for
  constructor anymore.
- `_final` calls rather `stream.end` than `close` because of callback.

## v1.2.0 2018-09-12

- New streams are `WriteStream` so `close` method can be used instead `end`.

## v1.1.0 2018-09-12

- Clean up streams more carefully after they are not needed anymore.

## v1.0.0 2018-09-07

- Rewritten in Typescript.
- Node >= 6 is required.
- New syntax of import in plain Javascript.
- `newFilename` function has `FileTimestampStream` object as its first argument.
- Removed `options` property.

## v0.6.0 2018-07-07

- `newFilename` function has `path` as its first argument.

## v0.5.0 2018-02-15

- Implemented `_writev` method which corks file stream, then makes this writter
  fast enough.

## v0.4.0 2018-02-04

- Support `import FileTimestampStream from 'file-timestamp-stream'` syntax.
- Typescript: export options as `FileTimestampStreamOptions`.

## v0.3.1 2018-02-04

- Better clean up on `destroy`.

## v0.3.0 2018-02-03

- Implemented `_final` method which calls `end` on file stream.

## v0.2.0 2018-02-02

- Only public interface of Writable is used.
- Implemented `_destroy` method which cleans up file stream.

## v0.1.0 2017-10-24

- Exports also as a class and namespace and the default.
- Property `wstream` was renamed to `stream`.
- Typescript: typings added.

## v0.0.4 2017-06-22

- Upgraded chai@4.0.2, standard@10.0.2, tap@10.5.1, tap-given@0.4.1
- Use snazzy and dirty-chai for tests

## v0.0.3 2017-02-19

- Upgraded tap-given

## v0.0.2 2017-02-17

- Minor optimizations and better error handling
- BDD tests
- Relicensed to MIT

## v0.0.1 2017-02-16

- Initial release
