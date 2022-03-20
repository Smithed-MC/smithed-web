

import {Blob} from 'blob-polyfill'
import Worker from 'web-worker'
// import Parallel from 'paralleljs'
globalThis.Blob = Blob
globalThis.Worker = Worker

import('./main.js').then((main) => {   
    main.start()
})

