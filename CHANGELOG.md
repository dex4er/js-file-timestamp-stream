# Changelog

## v1.1.0 2018-09-12

* Clean up streams more carefully after they are not needed anymore.

## v1.0.0 2018-09-07

* Rewritten in Typescript.
* Node >= 6 is required.
* New syntax of import in plain Javascript.
* `newFilename` function has `FileTimestampStream` object as its first argument.
* Removed `options` property.

## v0.6.0 2018-07-07

* `newFilename` function has `path` as its first argument.

## v0.5.0 2018-02-15

* Implemented `_writev` method which corks file stream, then makes this writter
  fast enough.

## v0.4.0 2018-02-04

* Support `import FileTimestampStream from 'file-timestamp-stream'` syntax.
* Typescript: export options as `FileTimestampStreamOptions`.

## v0.3.1 2018-02-04

* Better clean up on `destroy`.

## v0.3.0 2018-02-03

* Implemented `_final` method which calls `end` on file stream.

## v0.2.0 2018-02-02

* Only public interface of Writable is used.
* Implemented `_destroy` method which cleans up file stream.

## v0.1.0 2017-10-24

* Exports also as a class and namespace and the default.
* Property `wstream` was renamed to `stream`.
* Typescript: typings added.

## v0.0.4 2017-06-22

* Upgraded chai@4.0.2, standard@10.0.2, tap@10.5.1, tap-given@0.4.1
* Use snazzy and dirty-chai for tests

## v0.0.3 2017-02-19

* Upgraded tap-given

## v0.0.2 2017-02-17

* Minor optimizations and better error handling
* BDD tests
* Relicensed to MIT

## v0.0.1 2017-02-16

* Initial release
