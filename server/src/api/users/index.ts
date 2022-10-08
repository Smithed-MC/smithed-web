import { Request, Response } from "express";
import { backendApp } from "../../main.js";
import { getDatabase } from 'firebase-admin/database'

import('./packs/index.js')

async function getUser(req: Request, res: Response) {
    const {user} = req.params

    const db = getDatabase()

    const userRef = db.ref(`/users/${user}`)
    
    const displayName = (await userRef.child('displayName').get()).val()
    const donations = (await userRef.child('donations').get()).val()
    res.status(200).send({displayName: displayName, donations: donations})
}

backendApp.get('/users/:user', getUser) 