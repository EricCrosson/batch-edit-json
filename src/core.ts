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
type Logger =  (...message: any[]) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type json = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryCatch(func: () => any): Either<Error, json> {
    try {
        return Right(func())
    } catch (error) {
        return Left(error)
    }
}

export function readFile(
    log: Logger,
    file: string
): Either<Error, json> {
    debug.io(`Parsing ${file}`)
    log(`reading file`)
    return tryCatch(() => require(file))
}

export function writeFile(
    log: Logger,
    dryRun: boolean,
    file: string
): (data: json) => Future.FutureInstance<NodeJS.ErrnoException, void> {
    return function fileWriter(data: json) {
        return Future.tryP(async () => new Promise((resolve, reject) => {
            if (dryRun) {
                debug.io(`DRY RUN: Not writing file ${file}`)
                console.log(
                    `DRY RUN: File ${file}: skipping write with contents\n`,
                    JSON.stringify(data, null, 4)
                )
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


function addObject(obj: string, data: json) {
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
            (d) => Object.assign(data, d)
        )
        .extract()
}

function uncurriedAddObjects(objects: string[], data: json) {
    objects.forEach((obj) => data = addObject(obj, data))
    return data
}
export const addObjects = curry.call(uncurriedAddObjects)

function removeKey(prop: string, data: json) {
    debug.edit(`Removing key ${prop}`)
    const properties = prop.split('.')
    const finalKey = properties.pop()!

    let obj = data
    for (const property of properties) {
        obj = obj[property]
        if (obj === undefined) { return data }
    }

    delete obj[finalKey]
    return data
}

function uncurriedRemoveKeys(properties: string[], data: json) {
    properties.forEach((prop) => data = removeKey(prop, data))
    return data
}
export const removeKeys = curry.call(uncurriedRemoveKeys)
