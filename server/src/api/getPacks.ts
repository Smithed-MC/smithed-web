import { Request, Response } from "express";
import { backendApp } from "../main.js";
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'

interface PackEntry {
    added: number,
    updated: number,
    downloads: any,
    owner: string
}

export let cachedPacks: {[key: string] :PackEntry} = {}

export async function reCachePacks() {
    console.log('recache')
    const db = getDatabase()
    cachedPacks = (await db.ref('/packs').get()).val()

    for(let pack in cachedPacks) {
        cachedPacks[pack] = minimizeDownloads(cachedPacks[pack]);
    }

}

export function minimizeDownloads(pack: PackEntry) {
    for (let day in pack.downloads)
        pack.downloads[day] = Object.keys(pack.downloads[day]).length;
    return pack
}

export async function getPacks(req: Request, res: Response) {
    if(Object.keys(cachedPacks).length === 0) await reCachePacks()
    res.status(200).send(cachedPacks);
}
