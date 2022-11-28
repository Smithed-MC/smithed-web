import { Request, Response } from "express";
import { getDatabase } from "firebase-admin/database";
import { minimizeDownloads } from "./packs.js";

export default async function getPack(req: Request, res: Response) {
    const { pack } = req.query
    if (pack === '' || typeof pack !== 'string')
        return res.status(400).end('Pack not specified')
    const db = getDatabase()

    const packSnap = (await db.ref(`/packs/${pack}`).get())
    if(!packSnap.exists())
        return res.status(404).end('Pack not found')
    
    res.status(200).send(minimizeDownloads(packSnap.val()))
}