import express from "express"
import * as path from "path";
import { register as registerWebsite } from './website.js';
import { register as registerApi } from './api.js'
import 'dot-env'
const PORT = process.env.PORT || 25565;

export const app = express();

export function start() {
    registerWebsite()
    registerApi()

    app.use(express.static(path.resolve(process.cwd(), "../website/build")))

    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`)
    })
}