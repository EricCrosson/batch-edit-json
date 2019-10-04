namespace debug {
    export const edit = require('debug')('bej:edit')
    export const io = require('debug')('bej:io')
}

import fs from 'fs'
import * as Future from 'fluture'
import { Maybe } from 'purify-ts/Maybe'
import { Either, Left, Right } from 'purify-ts/Either'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { curry } = require('@thisables/curry')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryCatch(func: () => any): Either<Error, any> {
    try {
        return Right(func())
    } catch (error) {
        return Left(error)
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readFile(
    log: (...message: string[]) => void,
    file: string
): Either<Error, any> {
    debug.io(`Parsing ${file}`)
    log(`parsing`)
    return tryCatch(() => require(file))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function writeFile(
    log: (...message: string[]) => void,
    dryRun: boolean,
    file: string
): (data: any) => Future.FutureInstance<NodeJS.ErrnoException, string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function fileWriter(data: any): Future.FutureInstance<NodeJS.ErrnoException, string> {
        return Future.tryP(async () => new Promise((resolve, reject) => {
            if (dryRun) {
                debug.io(`DRY RUN: Not writing file ${file}`)
                log(`DRY RUN: Skipping write with contents\n`, JSON.stringify(data, null, 4))
                return resolve()
            }
            fs.writeFile(
                file,
                JSON.stringify(data, null, 4),
                (err: NodeJS.ErrnoException | null) => {
                    if (err !== null) {
                        reject(err)
                    } else {
                        debug.io(`Wrote file ${file}`)
                        log('write complete')
                        resolve()
                    }
                })
        }))
    }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addObject(log: (...message: string[]) => void, obj: string, data: any) {
    return tryCatch(() => JSON.parse(obj))
        .bimap(
            (error: Error) => {
                const errorType = Maybe
                    .fromNullable(error.stack)
                    .map(s => s.split(':'))
                    .map(arr => arr[0])
                    .orDefault('Unknown error')
                console.error(`Ignoring argument '--add ${obj}' for reason '${errorType}: ${error.message}'`)
                return data
            },
            (d) => {
                log(`adding object ${obj}`)
                return Object.assign(data, d)
            }
        )
        .extract()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function uncurriedAddObjects(log: (...message: string[]) => void, objects: string[], data: any) {
    objects.forEach((obj) => data = addObject(log, obj, data))
    return data
}
export const addObjects = curry.call(uncurriedAddObjects)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeKey(log: (...message: string[]) => void, prop: string, data: any) {
    if (prop === null) {
        return data
    }
    debug.edit(`Removing key ${prop}`)
    log(`removing key ${prop}`)
    delete data[prop]
    return data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function uncurriedRemoveKeys(log: (...message: string[]) => void, properties: string[], data: any) {
    properties.forEach((prop) => data = removeKey(log, prop, data))
    return data
}
export const removeKeys = curry.call(uncurriedRemoveKeys)
