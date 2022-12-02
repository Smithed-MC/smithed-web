import { Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { serviceAccount } from "../util/database.js";
import { minimizeDownloads } from "./getPacks.js";
import * as jose from 'jose'
import { getPrivateKey, verifyToken } from "../util/customToken.js";
import { v4 } from "uuid";
export default async function getToken(req: Request, res: Response) {
    const { token, expires } = req.query

    if (token === undefined)
        return res.status(400).send('Token not specified')

    try {
        var uid = (await getAuth().verifyIdToken(token as string)).uid
    } catch {
        return res.status(401).send('Invalid token, ensure it is a Firebase token and not a PAT')
    }

    // const db = await getDatabase()
    // const tokenIdentifier = await (async () => {
    //     let token = v4()
    //     while ((await db.ref(`tokens/${token}`).get()).exists()) {
    //         token = v4()
    //     }
    //     return token
    // })()


    try {
        const jwt = await new jose.SignJWT({})
            .setProtectedHeader({ alg: 'RS256', uid: uid })
            .setIssuer(serviceAccount.client_email)
            .setSubject(serviceAccount.client_email)
            .setAudience("https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit")
            .setExpirationTime(expires !== undefined ? expires as string : '1h')
            .setIssuedAt(Math.round(Date.now() / 1000))
            .sign(await getPrivateKey())

        res.status(200).send(jwt)
    } catch (e) {
        res.status(500).send((e as Error).message)
    }

}