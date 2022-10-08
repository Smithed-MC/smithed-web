import { Request, Response } from "express";
import { backendApp } from "../../../../main.js";
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'
import validateVersion from "../../../../validators/version.js";

import('./version.js')

async function getVersions(req: Request, res: Response) {
    const {user, pack} = req.params
    if(user === '') 
        return res.status(400).end('Invalid value for user')
        
    
    if(pack === '') 
        return res.status(400).end('Invalid value for pack')
        
    


    const db = getDatabase()

    const packs = await db.ref(`/users/${user}/packs`).get()

    if(!packs.exists()) 
        return res.status(404).send('User doesn\'t exist or has no packs')
        
    

    const packData = packs.val().find((p: any) => p.id === pack)

    if(packData === undefined) 
        return res.status(404).send('Pack does not exist for the specified user')

    
    
    res.status(200).send(packData.versions)
}

async function postVersions(req: Request, res: Response) {
    const {user, pack} = req.params
    const {token} = req.query
    const {data} = req.body.body


    if(token === undefined)
        return res.status(400).send('Token was not specified')
    if(data === undefined) 
        return res.status(400).send('No data was specified')
    const validationResults = validateVersion(data)
    if(validationResults.length > 0)
        return res.status(400).send(validationResults.map(e => e.toString()))

    try {
        var uid = (await getAuth().verifyIdToken(token as string)).uid;
    } catch {
        var uid = ''
    }
    
    if(user !== uid)
        return res.status(401).send('Token does not match the user UID specified')

    const db = getDatabase()

    const packsSnap = await db.ref(`/users/${user}/packs`).get()

    if(!packsSnap.exists())
        return res.status(404).send('User does not have any packs')

    const packs: any[] = packsSnap.val()

    const packIndex = packs.findIndex((p: any) => p.id === pack)
    if(packIndex === -1) 
        return res.status(404).send('Pack does not exist for the specified user')
    
    const packData = packs[packIndex]
    console.log(packData)
    
    const versions: any[] = packData.versions
    
    if(versions.findIndex(v => v.name === data.name) !== -1)
        return res.status(409).send('Version with that semver exists!')

    versions.push(data)
    
    await db.ref(`/users/${user}/packs/${packIndex}/versions`).set(versions)
    res.status(200).send('Successfully updated packs')
}


backendApp.get('/users/:user/packs/:pack/versions', getVersions)
backendApp.post('/users/:user/packs/:pack/versions', postVersions)