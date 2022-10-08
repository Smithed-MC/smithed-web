import { Request, Response } from "express";
import { backendApp } from "../../../main.js";
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'
import validatePack from "../../../validators/pack.js";

import('./versions/index.js')
import('./pack.js')

async function getPacks(req: Request, res: Response) {
    const {user} = req.params
    if(user === '') 
        return res.status(400).end('Invalid value for user')
    

    const db = getDatabase()

    const packs = await db.ref(`/users/${user}/packs`).get()

    if(!packs.exists())
        return res.status(404).send('Pack does not exist')


    res.status(200).send(packs.val())
}

async function postPacks(req: Request, res: Response) {
    const {user} = req.params
    const {token} = req.query
    const {data} = req.body.body


    if(token === undefined)
        return res.status(400).send('Token was not specified')
    if(data === undefined) 
        return res.status(400).send('No data was specified')
 
    try {
        var uid = (await getAuth().verifyIdToken(token as string)).uid;
    } catch {
        var uid = ''
    }
    if(user !== uid)
        return res.status(401).send('Token does not match the user UID specified')


    const validationResults = validatePack(data)
    if(validationResults.length > 0)
        return res.status(400).send(validationResults.map(e => e.toString()))
    

    

    const db = getDatabase()

    const packsRef = db.ref(`/users/${user}/packs`)
    const packsSnap = await packsRef.get()
    

    const packs: any[] = packsSnap.exists() ? packsSnap.val() : []

    if(packs.findIndex(p => p.id === data.id) !== -1) 
        return res.status(409).send('Pack with that ID already exists')
        
    console.log(data)
    packs.push(data)
    await packsRef.set(packs)
    res.status(200).send('Successfully updated packs')
}

backendApp.get('/users/:user/packs',  getPacks) 
backendApp.post('/users/:user/packs', postPacks) 