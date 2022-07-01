import express from "express"
import * as path from "path";
import { register as registerWebsite } from './website.js';
import { register as registerApi } from './api.js'
import 'dot-env'
const FRONT_PORT = process.env.FRONT_PORT || 8000;
const BACK_PORT = process.env.BACK_PORT || 9000;

export const frontendApp = express();
export const backendApp = express();

export function start() {
    registerWebsite()
    registerApi()

    frontendApp.use(express.static(path.resolve(process.cwd(), "../website/build")))

    frontendApp.listen(FRONT_PORT, () => {
        console.log(`Website frontend listening on ${FRONT_PORT}`)
    })

    backendApp.listen(BACK_PORT, () => {
        console.log(`API backend listening on ${BACK_PORT}`)
    })
}