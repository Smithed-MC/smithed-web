import { Request, Response } from "express-serve-static-core";
import { Database, get, ref, set } from "firebase/database";
import md5 from "md5";
import hash from 'object-hash'
import initialize from "../util/database.js";

export async function updateDownloads(db: Database, userHash: string, packs: string[]) {

    // Add user hash to each packs downloads
    for(let p of packs) {
        const entry = await get(ref(db, `packs/${p}`))
        console.log(p)
        if(!entry.exists()) continue;
        await set(ref(db, `packs/${p}/downloads/${new Date().toLocaleDateString().split('/').join('-')}/${userHash}`), userHash)

    }
}

export async function handle(req: Request, res: Response) {
    console.log('Incrementing downloads')
    const errorOut = (message: string) => {res.status(500).end(message)}

    const userHash = hash({
        ip: req.headers['x-forwarded-for'],
        user_agent: req.headers['user-agent']
    })

    const db = await initialize()
    if(db === undefined) return errorOut('Could not initialize database!')
    
    if(req.query.packs === undefined) return errorOut('No \'packs\' specified in query')
    updateDownloads(db, userHash, req.query.packs as string[])
    try {
        var packs = JSON.parse(req.query.packs as string)
    }
    catch(e) {  
        const error = e as Error 
        return errorOut(error.message)
    }

    // Grab our database
  

    // Send a response back
    try {
        res.status(200).end(`Successfully updated packs: \n  - ${packs.join('\n  - ')}`)
    } catch {
        return errorOut('Failed to update packs')
    }
}