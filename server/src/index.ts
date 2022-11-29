

import {Blob} from 'blob-polyfill'
import Worker from 'web-worker'
import {TransformStream} from 'web-streams-polyfill'
import {configure} from '@zip.js/zip.js'

// import Parallel from 'paralleljs'
globalThis.Blob = Blob
globalThis.Worker = Worker
globalThis.TransformStream = TransformStream


import('./main.js').then((main) => {   
    // configure({useWebWorkers: false})
    main.start()
})

export {}