# batch-edit-json [![Build status](https://travis-ci.org/EricCrosson/batch-edit-json.svg?branch=master)](https://travis-ci.org/EricCrosson/batch-edit-json) [![npm version](https://img.shields.io/npm/v/batch-edit-json.svg)](https://npmjs.org/package/batch-edit-json) [![codecov](https://codecov.io/gh/EricCrosson/batch-edit-json/branch/master/graph/badge.svg)](https://codecov.io/gh/EricCrosson/batch-edit-json)

> Batch-edit json files

## Install

```shell
npm install -g batch-edit-json
```

## Use

``` shell
Usage:
    batch-edit-json [-vd] [--remove=<key>]... [--add=<object>]... [--exclude=<exclude_path>]... <path>...
    batch-edit-json --help | --version

-r,--remove      Remove key from matching paths
-a,--add         Add object to matching paths
-e,--exclude     Paths (glob) to exclude
-v,--verbose     Be verbose when editing files, echoing filenames as they are edited
-d,--dry-run     Do not edit files, only output what edits would take place
-h,--help        Show this help message
--version        Show version number
```

All `path`s  may be globs.

## Related

- [globby](https://github.com/sindresorhus/globby)
