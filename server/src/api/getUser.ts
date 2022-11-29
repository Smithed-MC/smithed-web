import { Request, Response } from "express";
import { getDatabase } from 'firebase-admin/database'
import { fetchLocal } from "../util/fetchLocal.js";
import { validateInputs } from "../util/inputValidator.js";

export async function getUser(req: Request, res: Response) {
    const { uid, username } = req.query

    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid], 
        [{ type: 'string', name: 'username', required: false }, username]
    ])
    if(responses.length > 0)
        return res.status(400).send(responses.join('\n'))

        
    const db = getDatabase()

    const userRef = uid !== undefined ? db.ref(`/users/${uid}`) : db.ref(`/users/${await (await fetchLocal(`getUID?username=${username}`)).text()}`)

    const displayName = (await userRef.child('displayName').get()).val()
    const donations = (await userRef.child('donations').get()).val()
    res.status(200).send({ displayName: displayName, donations: donations })
}
