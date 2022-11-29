import { getDatabase } from "firebase-admin/database";
import { Request, Response } from "express";
import { sanitizeDisplayName } from "../util/user.js";

export async function getUID(req: Request, res: Response) {
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