import { getDatabase } from "firebase-admin/database";
import { Request, Response } from "express";
import { sanitizeDisplayName } from "../util/user.js";



export async function getSanitizedUsername(req: Request, res: Response) {
    const {username} = req.query
    if(username === '' || typeof username !== 'string')
        return res.status(400).end('Username not added')

    res.status(200).send(sanitizeDisplayName(username))
}

