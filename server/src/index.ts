

import {Blob} from 'blob-polyfill'
import Worker from 'web-worker'
// import Parallel from 'paralleljs'
globalThis.Blob = Blob
globalThis.Worker = Worker
import {configure} from '@zip.js/zip.js'


import('./main.js').then((main) => {   
    // configure({useWebWorkers: false})
    main.start()
})

export {}