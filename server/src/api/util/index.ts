import { backendApp } from "../../main.js";
import { Request, Response } from "express";
import { getDatabase } from "firebase-admin/database";
import { sanitizeDisplayName } from "../../util/user.js";


async function getUID(req: Request, res: Response) {
    const {username} = req.query
    if(username === '' || typeof username !== 'string')
        return res.status(400).end('Username not added')

    const db = getDatabase()
    const users = (await db.ref('/users').get()).val()

    const sanitizedUsername = sanitizeDisplayName(username)
    for(const uid in users) 
        if(sanitizeDisplayName(users[uid].displayName) === sanitizedUsername)
            return res.status(200).send(uid)
    return res.status(404).send('User with the displayName not found')
}

async function getSanitizedUsername(req: Request, res: Response) {
    const {username} = req.query
    if(username === '' || typeof username !== 'string')
        return res.status(400).end('Username not added')

    res.status(200).send(sanitizeDisplayName(username))
}

backendApp.get('/util/uid', getUID)
backendApp.get('/util/sanitize', getSanitizedUsername)