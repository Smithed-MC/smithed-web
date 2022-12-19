import { Request, Response } from "express";
import { getDatabase } from 'firebase-admin/database'

export async function getVersions(req: Request, res: Response) {
        
    const db = getDatabase()

    res.status(200).send((await db.ref('versions').get()).val() as string[])
}
