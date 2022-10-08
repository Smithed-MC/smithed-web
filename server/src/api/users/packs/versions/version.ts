import { Request, Response } from "express";
import { backendApp } from "../../../../main.js";
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'
import validateVersion from "../../../../validators/version.js";

async function getVersion(req: Request, res: Response) {
    const {user, pack, version} = req.params
    if(user === '') 
        return res.status(400).send('Invalid value for user')
        
    
    if(pack === '') 
        return res.status(400).send('Invalid value for pack')
        
    if(version === '')
        return res.status(400).send('Invalid value for version')
    


    const db = getDatabase()

    const packs = await db.ref(`/users/${user}/packs`).get()

    if(!packs.exists()) 
        return res.status(404).send('User doesn\'t exist or has no packs')
        
    
    const packData = packs.val().find((p: any) => p.id === pack)

    if(packData === undefined) 
        return res.status(404).send('Pack does not exist for the specified user')

    const versions = packData.versions ?? []

    const versionData = versions.find((v:any) => v.name === version)
    
    if(versionData === undefined)
        return res.status(404).send('Version does not exist for the specified pack')

    res.status(200).send(versionData)
}

async function putVersion(req: Request, res: Response) {
    const {user, pack, version} = req.params
    const {token} = req.query
    const {data} = req.body.body

    if(token === undefined || typeof token !== 'string') 
        return res.status(400).send('Token was not specified or was not a string')
        
    const validationResults = validateVersion(data)
    if(validationResults.length > 0)
        return res.status(400).send(validationResults.map(e => e.toString()))


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
        
    if(version === '')
        return res.status(400).send('Invalid value for version')


    const db = getDatabase()

    const packs = await db.ref(`/users/${user}/packs`).get()

    if(!packs.exists())
        return res.status(404).send('User doesn\'t exist or has no packs')
        
    

    const packIndex = packs.val().findIndex((p: any) => p.id === pack)

    if(packIndex === -1) 
        return res.status(404).send('Pack does not exist for the specified user')

    const versions = packs.val()[packIndex].versions ?? []

    const versionIndex = versions.findIndex((v: any) => v.name === version) 
    if(versionIndex === -1) 
        return res.status(404).send('Version does not exist for the specified pack')

    await db.ref(`/users/${user}/packs/${packIndex}/versions/${versionIndex}`).set(data)

    res.status(200).send('Successfully set the version data')
}

async function deleteVersion(req: Request, res: Response) {
    const {user, pack, version} = req.params
    const {token} = req.query

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
    
    const packs = packsSnapshot.val()

    const packIndex = packs.findIndex((p: any) => p.id === pack)

    if(packIndex === -1)
        return res.status(404).send('Pack does not exist for the specified user')
    
    const versions: any[] = packs[packIndex].versions ?? []

    const versionIndex = versions.findIndex((v: any) => v.name === version)
    if(versionIndex === -1)
        return res.status(404).send('Version does not exist for the specified pack')
    if(versions.length === 1)
        return res.status(409).send('Deleting this version would cause pack to have 0 versions available')
    
    versions.splice(versionIndex, 1)

    await db.ref(`/users/${user}/packs/${packIndex}/versions`).set(versions)
    res.status(200).send('Successfully deleted the pack')
}

backendApp.get('/users/:user/packs/:pack/versions/:version', getVersion) 
backendApp.put('/users/:user/packs/:pack/versions/:version', putVersion) 
backendApp.delete('/users/:user/packs/:pack/versions/:version', deleteVersion)