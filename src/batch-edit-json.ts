/**
 * batch-edit-json
 * Batch-edit json files
 */

/* eslint-disable @typescript-eslint/indent */
/* eslint-disable @typescript-eslint/promise-function-async */

namespace debug {
    export const options = require('debug')('bej:options')
    export const io = require('debug')('bej:io')
}

import { docopt } from 'docopt'
import { version } from './version'
import globby from 'globby'
import matcher from 'matcher'
import path from 'path'
import { Maybe } from 'purify-ts/Maybe'
import { Either, Left, Right } from 'purify-ts/Either'


interface UserOptions {
    "--help": boolean;
    "--version": boolean;
    "-a": boolean;
    "-r": boolean;
    "-e": boolean;
    "-v": boolean;
    "<key>": string;
    "<object>": string;
    "<exclude_path>": string;
    "<path>": string[];
}


const docstring = `
Usage:
    batch-edit-json [-v] [-r <key>] [-a <object>] [-e <exclude_path>] <path>...
    batch-edit-json --help | --version

-r               Remove key from matching paths
-a               Add object to matching paths
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
            (acc: string[], p) => options['-e'] && matcher.isMatch(p, options['<exclude_path>'])
                ? acc
                : [...acc, p],
            []
        )
        .map(p => [process.cwd(), p].join(path.sep))
    debug.io(`Matching paths:`, JSON.stringify(paths, null, 4))

    for (const file of paths) {
        readFile(file)
            // .map(data => {

            // })
            .bimap(
                console.error.bind(null),
                (data) => debug.io(file, JSON.stringify(data, null, 4))
            )
    }
}

main()
