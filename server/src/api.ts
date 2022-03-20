import { cleanCache, handle as handleDownload} from "./api/download.js";
import { app } from "./main.js";

export function register() {
    app.get('/api/download', handleDownload)
    setInterval(cleanCache, 10 * 1000)
}