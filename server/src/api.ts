import { cleanCache, handle as handleDownload} from "./api/download.js";
import getPack from "./api/getPack.js";
import {handle as handleIncDownload} from "./api/incrementDownload.js"
import { backendApp, frontendApp } from "./main.js";
import initialize from "./util/database.js";

export async function register() {
    import('./api/users/index.js')
    ;(await import('./api/packs.js')).default()
    import('./api/util/index.js')
    
    backendApp.get('/getPack', getPack)

    backendApp.get('/download', handleDownload)
    backendApp.get('/increment-download', handleIncDownload)

    // Make sure to wipe the cache every so often to save space on disk
    setInterval(cleanCache, 10 * 1000)
}