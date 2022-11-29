import { Request, Response } from "express";
import { backendApp } from "../main.js";
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'
import validatePack from "../validators/pack.js";
import { sanitizeDisplayName, tokenMatchesUID, uidOrGetFromUsername } from "../util/user.js";
import { fetchLocal } from "../util/fetchLocal.js";
import { validateInputs } from "../util/inputValidator.js";

export async function getUserPack(req: Request, res: Response) {
    const { uid, username, pack } = req.query

    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username],
        [{ type: 'string', name: 'pack', required: true }, pack]
    ])
    if (responses.length > 0)
        return res.status(400).send(responses.join('\n'))

    const db = getDatabase()

    const user = await uidOrGetFromUsername(uid as string, username as string)

    const packs = await db.ref(`/users/${user}/packs`).get()

    if (!packs.exists())
        return res.status(404).send('User doesn\'t exist or has no packs')

    const packData = packs.val().find((p: any) => p.id === pack)

    if (packData === undefined)
        return res.status(404).send('Pack does not exist for the specified user')



    res.status(200).send(packData)
}

export async function setUserPack(req: Request, res: Response) {
    const { uid, username, pack, token } = req.query
    const { data } = req.body.body


    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username],
        [{ type: 'string', name: 'pack', required: true }, pack],
        [{ type: 'string', name: 'token', required: true }, token],
        [{ type: 'object', name: 'data', required: true }, data]

    ])
    if (responses.length > 0)
        return res.status(400).send(responses.join('\n'))

    const validationResults = validatePack(data)
    if (validationResults.length > 0)
        return res.status(400).send(validationResults.map(e => e.toString()))

    const user = await uidOrGetFromUsername(uid as string, username as string)
    if (!await tokenMatchesUID(user, token as string))
        return res.status(401).send('Unauthorized')

    const db = getDatabase()

    const packs = await db.ref(`/users/${user}/packs`).get()

    if (!packs.exists())
        return res.status(404).send('User doesn\'t exist or has no packs')

    const packIndex = packs.val().findIndex((p: any) => p.id === pack)

    if (packIndex === -1)
        return res.status(404).send('Pack does not exist for the specified user')

    await db.ref(`/users/${user}/packs/${packIndex}`).set(data)

    res.status(200).send('Successfully set the pack data')
}

export async function deleteUserPack(req: Request, res: Response) {
    const { uid, username, pack, token } = req.query

    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username],
        [{ type: 'string', name: 'pack', required: true }, pack],
        [{ type: 'string', name: 'token', required: true }, token]
    ])
    if (responses.length > 0)
        return res.status(400).send(responses.join('\n'))

    const user = await uidOrGetFromUsername(uid as string, username as string)
    if (!await tokenMatchesUID(user, token as string))
        return res.status(401).send('Unauthorized')
    const db = getDatabase()
    const packsSnapshot = await db.ref(`/users/${user}/packs`).get()

    if (!packsSnapshot.exists())
        return res.status(404).send('User doesn\'t exist or has no packs')

    const packs: any[] = packsSnapshot.val()

    const packIndex = packs.findIndex((p: any) => p.id === pack)

    if (packIndex === -1)
        return res.status(404).send('Pack does not exist for the specified user')

    const removedPack = packs.splice(packIndex, 1)[0]

    await db.ref(`/users/${user}/packs`).set(packs)

    const rawDisplayName = (await db.ref(`/users/${user}/displayName`).get()).val()
    const safeName = sanitizeDisplayName(rawDisplayName)

    const packEntry = await db.ref(`/packs/${safeName}:${removedPack.id}`).get()
    if (packEntry.exists()) {
        await packEntry.ref.remove();
    }
    const queueEntry = await db.ref(`/queue/${safeName}:${removedPack.id}`).get()
    if (queueEntry.exists()) {
        await queueEntry.ref.remove();
    }

    res.status(200).send('Successfully deleted the pack')
}


export async function getUserPacks(req: Request, res: Response) {
    const { uid, username } = req.query
    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username]
    ])
    if (responses.length > 0)
        return res.status(400).send(responses.join('\n'))

    const user = await uidOrGetFromUsername(uid as string, username as string)
    const db = getDatabase()

    const packs = await db.ref(`/users/${user}/packs`).get()

    if (!packs.exists())
        return res.status(404).send('Pack does not exist')


    res.status(200).send(packs.val())
}

export async function addUserPack(req: Request, res: Response) {
    const { uid, username, token } = req.query
    console.log(req.body)
    const { data } = req.body.body

    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username],
        [{ type: 'string', name: 'token', required: true }, token],
        [{ type: 'object', name: 'data', required: true }, data]
    ])
    if (responses.length > 0)
        return res.status(400).send(responses.join('\n'))

    const user = await uidOrGetFromUsername(uid as string, username as string)
    if (!await tokenMatchesUID(user, token as string))
        return res.status(401).send('Unauthorized')

    const validationResults = validatePack(data)
    if (validationResults.length > 0)
        return res.status(400).send(validationResults.map(e => e.toString()))

    const db = getDatabase()

    const packsRef = db.ref(`/users/${user}/packs`)
    const packsSnap = await packsRef.get()

    const packs: any[] = packsSnap.exists() ? packsSnap.val() : []

    if (packs.findIndex(p => p.id === data.id) !== -1)
        return res.status(409).send('Pack with that ID already exists')

    console.log(data)
    packs.push(data)
    await packsRef.set(packs)
    res.status(200).send('Successfully updated packs')
}