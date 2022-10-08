import express, { NextFunction, Request, RequestHandler, Response } from "express"
import * as path from "path";
import { register as registerWebsite } from './website.js';
import { register as registerApi } from './api.js'
import { getAuth } from 'firebase-admin/auth'
import express_limiter from 'express-limiter'
import redis from 'redis'

import 'dot-env'
import initialize from "./util/database.js";
const FRONT_PORT = process.env.FRONT_PORT || 8000;
const BACK_PORT = process.env.BACK_PORT || 9000;

export const frontendApp = express();
export const backendApp = express();

export async function start() {
    initialize()
    registerWebsite()
    registerApi()

    frontendApp.use(express.static(path.resolve(process.cwd(), "../website/build")))
    backendApp.use(express.json())

    const rateDb: any = {}
    setInterval(() => {
        for(let k in rateDb)
            delete rateDb[k]
    }, 5 * 1000 * 60)
    backendApp.use(async function (req: Request, res: Response, next: NextFunction) {
        // if(req.socket.localAddress !== undefined) return next()

        let identifier = req.socket.remoteAddress ?? ''
        if(req.query.token !== undefined) {
            try {
                const user = await getAuth().verifyIdToken(req.query.token as string)
                identifier = user.uid
            } catch {}           
        }

        const dbEntry = rateDb[identifier]
        const data = dbEntry ?? {count:0,expire:Date.now()}

        if(data.expire < Date.now()) {
            data.count = 0
            return next();
        }
        data.count += 1
        data.expire = Date.now() + (1000 * 60)
        rateDb[identifier] = data
        if(data.count > (identifier === req.socket.remoteAddress ? 20 : 100)) return res.status(429).send('Try again in 1 minute')

        return next()
    })

    frontendApp.listen(FRONT_PORT, () => {
        console.log(`Website frontend listening on ${FRONT_PORT}`)
    })

    backendApp.listen(BACK_PORT, () => {
        console.log(`API backend listening on ${BACK_PORT}`)
    })


}