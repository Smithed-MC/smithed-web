import { Request, Response } from "express";
import { backendApp } from "../../../main.js";
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'
import validatePack from "../../../validators/pack.js";
import { sanitizeDisplayName } from "../../../util/user.js";

async function getPack(req: Request, res: Response) {
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

    
    
    res.status(200).send(packData)
}

async function putPack(req: Request, res: Response) {
    const {user, pack} = req.params
    const {token} = req.query
    const {data} = req.body.body

    const validationResults = validatePack(data)
    if(validationResults.length > 0)
        return res.status(400).send(validationResults.map(e => e.toString()))


    if(token === undefined || typeof token !== 'string') 
        return res.status(400).send('Token was not specified or was not a string')
        
    

    try {
        var uid = (await getAuth().verifyIdToken(token)).uid;
    } catch {
        var uid = ''
    }
    
    if(user !== uid) 
        return res.status(401).send('Token does not match the user UID specified')
        

    if(user === '')
        return res.status(400).end('Invalid value for user')
        
    
    if(pack === '') 
        return res.status(400).end('Invalid value for pack')
        
    


    const db = getDatabase()

    const packs = await db.ref(`/users/${user}/packs`).get()

    if(!packs.exists())
        return res.status(404).send('User doesn\'t exist or has no packs')
        
    

    const packIndex = packs.val().findIndex((p: any) => p.id === pack)

    if(packIndex === -1) 
        return res.status(404).send('Pack does not exist for the specified user')
        
    
    
    await db.ref(`/users/${user}/packs/${packIndex}`).set(data)

    res.status(200).send('Successfully set the pack data')
}

async function deletePack(req: Request, res: Response) {
    const {user, pack} = req.params
    const {token} = req.query
    const {data} = req.body

    if(token === undefined || typeof token !== 'string') 
        return res.status(400).send('Token was not specified or was not a string')
        


    try {
        var uid = (await getAuth().verifyIdToken(token)).uid;
    } catch {
        var uid = ''
    }
    
    if(user !== uid) 
        return res.status(401).send('Token does not match the user UID specified')
        

    if(user === '')
        return res.status(400).send('Invalid value for user')
        
    if(pack === '') 
        return res.status(400).send('Invalid value for pack')
        


    const db = getDatabase()

    const packsSnapshot = await db.ref(`/users/${user}/packs`).get()

    if(!packsSnapshot.exists()) 
        return res.status(404).send('User doesn\'t exist or has no packs')
    
    const packs: any[] = packsSnapshot.val()

    const packIndex = packs.findIndex((p: any) => p.id === pack)

    if(packIndex === -1)
        return res.status(404).send('Pack does not exist for the specified user')
    
    const removedPack = packs.splice(packIndex, 1)[0]

    await db.ref(`/users/${user}/packs`).set(packs)

    const rawDisplayName = (await db.ref(`/users/${user}/displayName`).get()).val()
    const safeName = sanitizeDisplayName(rawDisplayName)

    const packEntry = await db.ref(`/packs/${safeName}:${removedPack.id}`).get()
    if(packEntry.exists()) {
        await packEntry.ref.remove();
    }
    const queueEntry = await db.ref(`/queue/${safeName}:${removedPack.id}`).get()
    if(queueEntry.exists()) {
        await queueEntry.ref.remove();
    }

    res.status(200).send('Successfully deleted the pack')
}

backendApp.get('/users/:user/packs/:pack', getPack) 
backendApp.put('/users/:user/packs/:pack', putPack) 
backendApp.delete('/users/:user/packs/:pack', deletePack)

