import { Request, Response } from "express";
import { backendApp } from "../../main.js";
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'
import validateVersion, { Version } from "../../validators/version.js";
import { validateInputs } from "../../util/inputValidator.js";
import { tokenMatchesUID, uidOrGetFromUsername } from "../../util/user.js";

export async function getUserPackVersion(req: Request, res: Response) {
    const { username, uid, pack, version } = req.query
    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username],
        [{ type: 'string', name: 'pack', required: true }, pack],
        [{ type: 'string', name: 'version', required: true }, version]
    ])
    if (responses.length > 0)
        return res.status(400).end(responses.join('\n'))

    const db = getDatabase()
    const user = await uidOrGetFromUsername(uid as string, username as string)

    const packs = await db.ref(`/users/${user}/packs`).get()

    if (!packs.exists())
        return res.status(404).send('User doesn\'t exist or has no packs')


    const packData = packs.val().find((p: any) => p.id === pack)

    if (packData === undefined)
        return res.status(404).send('Pack does not exist for the specified user')

    const versions = packData.versions ?? []

    const versionData = versions.find((v: any) => v.name === version)

    if (versionData === undefined)
        return res.status(404).send('Version does not exist for the specified pack')

    res.status(200).send(versionData)
}

export async function setUserPackVersion(req: Request, res: Response) {
    const { uid, username, pack, version, token } = req.query
    const { data } = req.body
    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username],
        [{ type: 'string', name: 'pack', required: true }, pack],
        [{ type: 'string', name: 'version', required: true }, version],
        [{ type: 'string', name: 'token', required: true }, token],
        [{ type: 'object', name: 'data', required: true }, data]
    ])
    if (responses.length > 0)
        return res.status(400).end(responses.join('\n'))

    const user = await uidOrGetFromUsername(uid as string, username as string)
    if (!await tokenMatchesUID(user, token as string))
        return res.status(401).send('Unauthorized')

    const validationResults = validateVersion(data)
    if (validationResults.length > 0)
        return res.status(400).send(validationResults.map(e => e.toString()))


    const db = getDatabase()

    const packs = await db.ref(`/users/${user}/packs`).get()

    if (!packs.exists())
        return res.status(404).send('User doesn\'t exist or has no packs')



    const packIndex = packs.val().findIndex((p: any) => p.id === pack)

    if (packIndex === -1)
        return res.status(404).send('Pack does not exist for the specified user')

    const versions = packs.val()[packIndex].versions ?? []

    const versionIndex = versions.findIndex((v: any) => v.name === version)
    if (versionIndex === -1)
        return res.status(404).send('Version does not exist for the specified pack')

    await db.ref(`/users/${user}/packs/${packIndex}/versions/${versionIndex}`).set(data)

    res.status(200).send('Successfully set the version data')
}

export async function deleteUserPackVersion(req: Request, res: Response) {
    const { uid, username, pack, version, token } = req.query
    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username],
        [{ type: 'string', name: 'pack', required: true }, pack],
        [{ type: 'string', name: 'version', required: true }, version],
        [{ type: 'string', name: 'token', required: true }, token],
    ])
    if (responses.length > 0)
        return res.status(400).end(responses.join('\n'))

    const user = await uidOrGetFromUsername(uid as string, username as string)
    if (!await tokenMatchesUID(user, token as string))
        return res.status(401).send('Unauthorized')


    const db = getDatabase()

    const packsSnapshot = await db.ref(`/users/${user}/packs`).get()

    if (!packsSnapshot.exists())
        return res.status(404).send('User doesn\'t exist or has no packs')

    const packs = packsSnapshot.val()

    const packIndex = packs.findIndex((p: any) => p.id === pack)

    if (packIndex === -1)
        return res.status(404).send('Pack does not exist for the specified user')

    const versions: any[] = packs[packIndex].versions ?? []

    const versionIndex = versions.findIndex((v: any) => v.name === version)
    if (versionIndex === -1)
        return res.status(404).send('Version does not exist for the specified pack')
    if (versions.length === 1)
        return res.status(409).send('Deleting this version would cause pack to have 0 versions available')

    versions.splice(versionIndex, 1)

    await db.ref(`/users/${user}/packs/${packIndex}/versions`).set(versions)
    res.status(200).send('Successfully deleted the pack')
}


export async function getUserPackVersions(req: Request, res: Response) {
    const { uid, username, pack } = req.query
    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username],
        [{ type: 'string', name: 'pack', required: true }, pack],
    ])
    if (responses.length > 0)
        return res.status(400).end(responses.join('\n'))

    const user = await uidOrGetFromUsername(uid as string, username as string)
    const db = getDatabase()

    const packs = await db.ref(`/users/${user}/packs`).get()

    if (!packs.exists())
        return res.status(404).send('User doesn\'t exist or has no packs')

    const packData = packs.val().find((p: any) => p.id === pack)

    if (packData === undefined)
        return res.status(404).send('Pack does not exist for the specified user')



    res.status(200).send(packData.versions)
}

export async function addUserPackVersion(req: Request, res: Response) {
    const { uid, username, pack, token } = req.query
    const { data }: {data: Version} = req.body
    const responses = validateInputs([
        [{ type: 'string', name: 'uid', required: false }, uid],
        [{ type: 'string', name: 'username', required: false }, username],
        [{ type: 'string', name: 'pack', required: true }, pack],
        [{ type: 'object', name: 'data', required: true }, data],
        [{ type: 'string', name: 'token', required: true }, token],
    ])


    if (responses.length > 0)
        return res.status(400).end(responses.join('\n'))


    const validationResults = validateVersion(data)
    if (validationResults.length > 0)
        return res.status(400).send(validationResults.map(e => e.toString()))


    const user = await uidOrGetFromUsername(uid as string, username as string)
    if (!await tokenMatchesUID(user, token as string))
        return res.status(401).send('Unauthorized')

    const db = getDatabase()

    const packsSnap = await db.ref(`/users/${user}/packs`).get()

    if (!packsSnap.exists())
        return res.status(404).send('User does not have any packs')

    const packs: any[] = packsSnap.val()

    const packIndex = packs.findIndex((p: any) => p.id === pack)
    if (packIndex === -1)
        return res.status(404).send('Pack does not exist for the specified user')

    const packData = packs[packIndex]
    console.log(packData)

    const versions: any[] = packData.versions

    if (versions.findIndex(v => v.name === data.name) !== -1)
        return res.status(409).send('Version with that semver exists!')

    versions.push(data)

    await db.ref(`/users/${user}/packs/${packIndex}/versions`).set(versions)
    res.status(200).send('Successfully updated packs')
}
