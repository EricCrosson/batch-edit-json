/**
 * batch-edit-json
 * Batch-edit json files
 */

/* eslint-disable @typescript-eslint/indent */
/* eslint-disable @typescript-eslint/promise-function-async */

namespace debug {
    export const options = require('debug')('bej:options')
    export const io = require('debug')('bej:io')
    export const edit = require('debug')('bej:edit')
}

import { docopt } from 'docopt'
import { version } from './version'
import globby from 'globby'
import matcher from 'matcher'
import path from 'path'
import { Maybe } from 'purify-ts/Maybe'
import { Either, Left, Right } from 'purify-ts/Either'

const { curry } = require('@thisables/curry')


interface UserOptions {
    "--help": boolean;
    "--version": boolean;
    "-v": boolean;
    "--add": string[];
    "--remove": string[];
    "--exclude": string[];
    "<path>": string[];
}


const docstring = `
Usage:
    batch-edit-json [-v] [--remove=<key>]... [--add=<object>]... [--exclude=<exclude_path>]... <path>...
    batch-edit-json --help | --version

-r,--remove      Remove key from matching paths
-a,--add         Add object to matching paths
-e,--exclude     Paths (glob) to exclude
-v,--verbose     Be verbose when editing files, echoing filenames as they are edited
-h,--help        Show this help message
--version        Show version number
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryCatch(func: Function): Either<any, Error> {
    try {
        return Right(func())
    } catch (error) {
        return Left(error)
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readFile(file: string): Either<any, Error> {
    debug.io(`Parsing ${file}`)
    return tryCatch(() => require(file))
}

function removeKey(prop: string, data: any) {
    if (prop === null) {
        return data
    }
    debug.edit(`Removing key ${prop}`)
    delete data[prop]
    return data
}

function uncurriedRemoveKeys(properties: string[], data: any) {
    properties.forEach(prop => data = removeKey(prop, data))
    return data
}
const removeKeys = curry.call(uncurriedRemoveKeys)

function main(): void {

    const options: UserOptions = docopt(docstring, {
        help: true,
        version: version,
        exit: true
    })
    debug.options(JSON.stringify(options, null, 4))

    const paths = options['<path>']
        .reduce(
            (acc: string[], path) => [...acc, ...globby.sync(path)],
            []
        )
        .reduce(
            (acc: string[], p) =>
                options['--exclude'].length > 0 && matcher([p], options['--exclude']).length > 0
                ? acc
                : [...acc, p],
            []
        )
        .map(p => [process.cwd(), p].join(path.sep))
    debug.io(`Matching paths:`, JSON.stringify(paths, null, 4))

    for (const file of paths) {
        readFile(file)
            .map(removeKeys(options['--remove']))
            .bimap(
                console.error.bind(null),
                (data) => debug.io(file, JSON.stringify(data, null, 4))
            )
    }
}

main()
