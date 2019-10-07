#!/usr/bin/env node
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function verboseStreamLogger(...message: any[]): void {
        if (verbose) {
            stream(`File ${file}:`, ...message)
        }
    }
}

async function main(): Promise<void> {

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

    const promises: Promise<number>[] = [Promise.resolve(0)]

    for (const file of paths) {
        const verbose = verboseLogger(options['-v'], file)

        readFile(verbose, file)
            .map(removeKeys(options['--remove']))
            .map(addObjects(options['--add']))
            .map(writeFile(verbose, dryRun, file))
            .bimap(
                (error) => {
                    promises.push(Promise.resolve(1))
                    console.error(error)
                },
                (future) => promises.push(
                    new Promise((resolve, reject) => {
                        future.fork(
                            (error) => {
                                console.error(error)
                                reject(1)
                            },
                            () => resolve(0)
                        )
                    }))
            )
    }

    await Promise.all(promises)
        .then(exitCodes =>
              process.exit(exitCodes.reduce((acc, code) => acc + code)))
}

main()
