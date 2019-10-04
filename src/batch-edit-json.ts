/**
 * batch-edit-json
 * Batch-edit json files
 */

namespace debug {
    export const options = require('debug')('bej:options')
}

import { docopt } from 'docopt'
import { version } from './version'


interface UserOptions {
    "--help": boolean;
    "--version": boolean;
    "-a": boolean;
    "-r": boolean;
    "-v": boolean;
    "<key>": string;
    "<object>": string;
    "<path>": string[];
}


const docstring: string = `
Usage:
    batch-edit-json [-v] [-r <key>] [-a <object>] <path>...
    batch-edit-json --help | --version

-r               Remove key from matching paths
-a               Add object to matching paths
-v,--verbose     Be verbose when editing files, echoing filenames as they are edited
-h,--help        Show this help message
--version        Show version number
`

const options: UserOptions = docopt(docstring, {
    help: true,
    version: version,
    exit: true
})

debug.options(JSON.stringify(options, null, 4))
