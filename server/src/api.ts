import { cleanCache, handle as handleDownload} from "./api/download.js";
import {handle as handleIncDownload} from "./api/incrementDownload.js"
import { backendApp, frontendApp } from "./main.js";
import initialize from "./util/database.js";

export function register() {
    initialize()
    import('./api/users/index.js')
    import('./api/packs.js')
    import('./api/util/index.js')
    backendApp.get('/download', handleDownload)
    backendApp.get('/increment-download', handleIncDownload)

    // Make sure to wipe the cache every so often to save space on disk
    setInterval(cleanCache, 10 * 1000)
}