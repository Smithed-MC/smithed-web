import { cleanCache, handle as handleDownload} from "./api/download.js";
import {handle as handleIncDownload} from "./api/incrementDownload.js"
import { backendApp, frontendApp } from "./main.js";

export function register() {
    backendApp.get('/download', handleDownload)
    backendApp.get('/increment-download', handleIncDownload)

    // Make sure to wipe the cache every so often to save space on disk
    setInterval(cleanCache, 10 * 1000)
}