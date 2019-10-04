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

import { readFile, writeFile, addObjects, removeKeys } from './core'

import { docopt } from 'docopt'
import { version } from './version'
import globby from 'globby'
import matcher from 'matcher'
import path from 'path'


interface UserOptions {
    "--help": boolean;
    "--version": boolean;
    "-v": boolean;
    "-d": boolean;
    "--add": string[];
    "--remove": string[];
    "--exclude": string[];
    "<path>": string[];
}


const docstring = `
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
`

function reduceGlobsToPaths(accumulator: string[], glob: string): string[] {
    return [...accumulator, ...globby.sync(glob)]
}

function reduceRemoveExcludedPaths(options: UserOptions): (accumulator: string[], path: string) => string[] {
    return function reducerRemoveExcludedPaths(accumulator: string[], path: string): string[] {
        return options['--exclude'].length > 0 && matcher([path], options['--exclude']).length > 0
            ? accumulator
            : [...accumulator, path]
    }
}

function verboseLogger(verbose: boolean, file: string, stream = console.log.bind(null)) {
    return function verboseStreamLogger(...message: any[]) {
        if (verbose) {
            stream(`File ${file}:`, ...message)
        }
    }
}

function main(): void {

    const options: UserOptions = docopt(docstring, {
        help: true,
        version: version,
        exit: true
    })
    debug.options(JSON.stringify(options, null, 4))

    const paths = options['<path>']
        .reduce(reduceGlobsToPaths, [])
        .reduce(reduceRemoveExcludedPaths(options), [])
        .map(p => path.resolve(process.cwd(), p))
    debug.io(`Matching paths:`, JSON.stringify(paths, null, 4))

    const dryRun = options['-d']

    for (const file of paths) {
        const verbose = verboseLogger(options['-v'], file)

        readFile(verbose, file)
            .map(removeKeys(verbose, options['--remove']))
            .map(addObjects(verbose, options['--add']))
            .map(writeFile(verbose, dryRun, file))
            .bimap(
                console.error.bind(null),
                (future) => future.fork(
                    console.error.bind(null),
                    () => {}
                )
            )
    }
}

main()
