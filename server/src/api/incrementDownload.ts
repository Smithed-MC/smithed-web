import { Request, Response } from "express-serve-static-core";
import { Database } from "firebase-admin/database";
import md5 from "md5";
import hash from 'object-hash'
import initialize from "../util/database.js";
import { cachedPacks, reCachePacks } from "./packs.js";

export async function updateDownloads(db: Database, userHash: string, packs: string[]) {

    // Add user hash to each packs downloads
    for(let p of packs) {
        const entry = await db.ref(`packs/${p}`).get()
        console.log(p)
        if(!entry.exists()) continue;
        const date = new Date().toLocaleDateString().split('/').join('-');
        await db.ref(`packs/${p}/downloads/${date}/${userHash}`).set(userHash)
        cachedPacks[p].downloads[date] += 1
    }
}

export async function handle(req: Request, res: Response) {
    console.log('Incrementing downloads')

    const userHash = hash({
        ip: req.headers['x-forwarded-for'],
        user_agent: req.headers['user-agent']
    })

    const db = await initialize()
    if(db === undefined) return res.status(500).send('Could not initialize database!')
    
    if(req.query.packs === undefined) return res.status(400).send('No \'packs\' specified in query')
    updateDownloads(db, userHash, req.query.packs as string[])
    try {
        var packs = JSON.parse(req.query.packs as string)
    }
    catch(e) {  
        const error = e as Error 
        return res.status(500).send(error.message)
    }

    // Grab our database
  

    return res.status(200).end(`Successfully updated packs: \n  - ${packs.join('\n  - ')}`)
}