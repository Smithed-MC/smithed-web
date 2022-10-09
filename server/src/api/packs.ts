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
        console.log(pack)
        for(let day in cachedPacks[pack].downloads)
            cachedPacks[pack].downloads[day] = Object.keys(cachedPacks[pack].downloads[day]).length
    }

}

async function getPacks(req: Request, res: Response) {
    if(Object.keys(cachedPacks).length === 0) await reCachePacks()
    res.status(200).send(cachedPacks);
}
console.log(backendApp)

export default function register() {
    backendApp.get('/packs', getPacks)
}