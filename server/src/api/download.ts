import { Request, Response } from 'express-serve-static-core'
import { ref, set as setDB, get as getDB, Database } from 'firebase/database'
import { PackBuilder } from 'slimeball/out/util'
import DefaultResourcepackBuilder from 'slimeball/out/resourcepack.js'
import { WeldDatapackBuilder } from 'smithed-weld/out/datapack.js'
import initialize from '../database.js'
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import Blob from 'blob-polyfill'
import fetch from 'node-fetch'
import md5 from 'md5'
import fs from 'fs'
import path from 'path'
async function get(database: Database, path: string) {
    return await getDB(ref(database, path))
}

type PackDownloadMode = 'datapack' | 'resourcepack' | 'both'

type PackQuery = {
    id: string
    owner: string
    version?: string
}

type PackDownloadResult = {
    dp: [string, Blob | undefined]
    rp: [string, Blob | undefined]
    ids: string[]
}

export default class PackDownloader {
    private datapacks: [string, Buffer][] = []
    private resourcepacks: [string, Buffer][] = []
    private packIds: string[] = []
    private gameVersion: string = '1.18.1'
    private onStatus: (element: string, spam?: boolean) => void

    private dpBlob: [string, Blob | undefined] = ['', undefined]
    private rpBlob: [string, Blob | undefined] = ['', undefined]
    private database: Database
    constructor(database: Database, onStatus: (message: string, spam?: boolean) => void, gameVersion?: string) {
        this.onStatus = onStatus
        this.database = database
        if (gameVersion) this.gameVersion = gameVersion
    }


    private async getPackData(uid: string, id: string) {
        const ownerPacks = (await get(this.database, `users/${uid}/packs`)).val() as any[]

        for (let p of ownerPacks) {
            if (p.id === id) {
                if (p.versions instanceof Array) {
                    return p;
                } else {
                    let versions: any[] = []
                    for (let v in p.versions) {
                        let version = p.versions[v]
                        version.name = v.replaceAll('_', '.');
                        versions.push(version)
                    }
                    p.versions = versions;
                    return p
                }
            }
        }
        return null;
    }

    // async function getLatestVersionNumber(pack: any): Promise<string | undefined> {
    //     return pack.versions[pack.versions.length - 1].name;
    // }
    private async getVersionData(pack: {[key: string]: any}, version?: string): Promise<any> {
        var versionData: { name: string, supports: string[], dependencies: any[] } | undefined
        // console.log(version)
        // console.log(pack.versions)
        if (version != null && version !== '' && pack.versions.find((v: any) => v.name === version) != null) {
            // console.log('did we make it')
            versionData = pack.versions.find((v: any) => v.name === version)
        } else {
            let versions: { name: string, supports: string[], dependencies: any[] }[] = pack.versions;
            versionData = versions.reverse().find((v) => v.supports.includes(this.gameVersion))
            if (versionData === undefined) {
                let supports: string[] = []
                for (let v of versions)
                    for (let s of v.supports)
                        if (!supports.includes(s)) supports.push(s)

                throw new Error(`Valid version could not be found for pack '${pack.id}' on Minecraft Version ${this.gameVersion}!\n'${pack.id}' supports: ${supports.join(', ')}\nTry adding '&version=<gameVersion>' to resolve the issue!`)
                return null
            }
        }
        return versionData
    }

    private async fetchFile(url: string): Promise<Buffer | null> {
        try {
            const resp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
            if (resp.ok) {
                const buffer = await resp.arrayBuffer()
                return buffer as Buffer;
            } else {
                throw new Error(`Error while downloading pack! ${resp.json()}`)
            }
        } catch (e: any) {
            // console.log(e)
            return null;
        }
    }

    private async downloadPack(entry: any, id: string, version?: string) {
        const pack = await this.getPackData(entry["owner"], id);
        // console.log('made it ')
        // console.log(pack)

        const versionData = await this.getVersionData(pack, version)
        this.packIds.push(id + '@' + versionData.name)
        // console.log(versionData)
        if (versionData != null) {
            if (versionData["downloads"] != null) {
                const { datapack, resourcepack }: { datapack: string, resourcepack: string } = versionData["downloads"]
                // console.log(datapack)
                // console.log(resourcepack)
                if (datapack !== undefined && datapack !== '') {
                    const zip = await this.fetchFile(datapack)
                    if (zip != null)
                        this.datapacks.push([id, zip])
                }
                if (resourcepack !== undefined && resourcepack !== '') {
                    const zip = await this.fetchFile(resourcepack)
                    if (zip != null)
                        this.resourcepacks.push([id, zip])
                }
            }

            if (versionData["dependencies"] != null && versionData["dependencies"].length > 0) {
                for (var d of versionData["dependencies"]) {
                    // console.log(d)
                    const [owner, id] = d.id.split(':')
                    const version = d.version
                    await this.startDownload(owner, id, version)
                }
            }
        }
    }


    private async startDownload(owner: string, id: string, version?: string) {
        const dbEntry = (await get(this.database, `packs/${owner}:${id}`)).val()

        this.onStatus(`Downloading pack:\n${owner}:${id}`)

        if (dbEntry != null) {
            await this.downloadPack(dbEntry, id, version)
        }
    }

    private async generateFinal(builder: PackBuilder, packs: [string, Buffer][], state?: string) {
        console.log('loading')
        await builder.loadBuffers(packs)
        this.onStatus(`Building\n${state ? state : ''}`)
        console.log('done loading\nbuilding')
        const r = await builder.build(this.onStatus)
        console.log('done building')

        let lastPercent = 0
        const blob = await r.zip.close(undefined, {
            'onprogress': (p, total, entry) => {
                const percent = Math.ceil(p * 100 / total)
                if (lastPercent < percent) {
                    console.log(percent)
                    lastPercent = percent
                }
            }
        })
        console.log(blob)
        return blob
    }
    private incrementDownloads() {
        fetch(`https://vercel.smithed.dev/api/update-download?packs=${JSON.stringify(this.packIds.map(m => m.split('@')[0]))}`, { 'method': 'no-cors' })
    }

    public async getPacksHash(packs: { id: string, owner: string, version?: string }[]) {
        const packIds = []
        for (const p of packs) {

            if (p.version != undefined) { 
                packIds.push(`${p.owner}:${p.id}@${p.version}`); 
                continue 
            }

            const dbEntry = (await get(this.database, `packs/${p.owner}:${p.id}`))
            if (!dbEntry.exists()) continue

            const versionName = this.getVersionData(await this.getPackData(dbEntry.val()["owner"], p.id))
            if (versionName === undefined) continue

            packIds.push(`${p.owner}:${p.id}@${versionName}`)
        }

        return hashIds(packIds)
    }

    public async downloadAndMerge(packs: PackQuery[], mode: PackDownloadMode) {
        this.datapacks = []
        this.resourcepacks = []
        this.dpBlob[0] = ''
        this.rpBlob[0] = ''

        this.packIds = []

        for (let p of packs) {

            await this.startDownload(p.owner, p.id, p.version)
        }

        this.onStatus(`Done downloading packs`)

        this.incrementDownloads()


        this.onStatus(`Incremented download counts`)


        if (this.datapacks.length > 0 && (mode === 'both' || mode === 'datapack')) {
            // const jarLink = (await database.ref(`meta/vanilla/${gameVersion.replace(/[.]+/g, '_')}`).get()).val()
            // const jar = await fetchFile(jarLink);
            // if (jar != null) {
            //     console.log(jar);
            const dpb = new WeldDatapackBuilder(this.gameVersion)


            this.onStatus('Starting to merge datapacks')

            const blob = await this.generateFinal(dpb, this.datapacks, 'Datapack')
            const name = packs.length === 1 ? `${packs[0].id}-datapack.zip` : 'datapacks.zip'
            this.dpBlob = [name, blob]

            this.onStatus(`Finished merging datapacks`)

            // }
        }
        if (this.resourcepacks.length > 0 && (mode === 'both' || mode === 'resourcepack')) {


            this.onStatus(`Started to merge resourcepacks`)

            const rpb = new DefaultResourcepackBuilder();

            const blob = await this.generateFinal(rpb, this.resourcepacks, 'Resourcepack')
            const name = packs.length === 1 ? `${packs[0].id}-resourcepack.zip` : 'resourcepack.zip'
            this.rpBlob = [name, blob]


            this.onStatus(`Finished merging resourcepacks`)
        }
        return { dp: this.dpBlob, rp: this.rpBlob, ids: this.packIds }
    }

}

const cacheDir = path.join(process.cwd(), 'cache')

export async function handle(req: Request, res: Response) {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir)
    if (req.query.pack === undefined) { res.status(400).send('No packs added'); return }


    const mode = (req.query.mode as PackDownloadMode) || 'both'
    const version = req.query.version as string
    let packs: PackQuery[] = []
    if (typeof (req.query.pack) === 'string') packs = [mapQueryToObject(req.query.pack)]
    if (req.query.pack instanceof Array) packs = (req.query.pack as string[]).map(mapQueryToObject)

    const db = await initialize()
    if (db === undefined) {
        res.status(500).send('FAILED TO INIT DATABASE')
        return
    }
    const pd = new PackDownloader(db, m => (console.log(m)), version)
    const cacheFile = await pd.getPacksHash(packs) + '-' + mode.charAt(0)
    console.log(cacheFile)
    if (fs.existsSync(path.join(cacheDir, cacheFile))) {
        console.log('Sending cached file!')
        res.download(path.join(cacheDir, cacheFile), getFileName(packs.length, mode), undefined)
    } else {
        console.log('Creating new file!')
        mergeNewData(packs, mode, version, res, pd, cacheFile)
    }

}

function getFileName(packCount: number, mode: PackDownloadMode) {
    if(mode !== 'both')
        var name = mode as string
    else
        var name = 'pack'
        
    return name + (packCount > 1 ? 's' : '') + '.zip'
}

async function mergeNewData(packs: PackQuery[], mode: PackDownloadMode, version: string|undefined, res: Response, pd: PackDownloader, cacheFile: string) {


    const downloadPromise = pd.downloadAndMerge(packs, mode)
    downloadPromise.catch((e: Error) => res.status(400).send(e.message))
    const completed = await downloadPromise

    if (mode === 'both') {
        await sendBoth(completed, res, cacheFile)
    } else if (mode === 'datapack')
        await sendDatapack(completed, res, cacheFile)
    else
        await sendResourcepack(completed, res, cacheFile)
}


async function sendBoth(completed: PackDownloadResult, res: Response, cacheFile: string) {
    const final = new ZipWriter(new BlobWriter("application/zip"))
    if (completed.rp[1])
        await final.add(completed.rp[0], new BlobReader(completed.rp[1]))
    if (completed.dp[1])
        await final.add(completed.dp[0], new BlobReader(completed.dp[1]))

    const finalBlob: Blob = await final.close()
    const filePath = path.join(cacheDir, cacheFile)
    fs.writeFileSync(filePath, Buffer.from(await finalBlob.arrayBuffer()))
    res.download(filePath, 'packs.zip', undefined)
}

async function sendDatapack(completed: PackDownloadResult, res: Response, cacheFile: string) {
    const filePath = path.join(cacheDir, cacheFile)
    if(!completed.dp[1]) { res.status(500).send('Datapack \'Blob\' was undefined'); return }
    fs.writeFileSync(filePath, Buffer.from(await completed.dp[1].arrayBuffer()))
    res.download(filePath, 'datapacks.zip', undefined)
}

async function sendResourcepack(completed: PackDownloadResult, res: Response, cacheFile: string) {
    const filePath = path.join(cacheDir, cacheFile)
    if(!completed.rp[1]) { res.status(500).send('Datapack \'Blob\' was undefined'); return }
    fs.writeFileSync(filePath, Buffer.from(await completed.rp[1].arrayBuffer()))
    res.download(filePath, 'resourcepacks.zip', undefined)
}


function hashIds(ids: string[]) {
    return md5(ids.sort().join(''))
}

function mapQueryToObject(m: string) {
    const owner = m.split(':')[0]
    const id = m.split(':')[1].split('@')[0]
    const version = m.includes('@') ? m.split(':')[1].split('@')[1] : undefined
    return { owner: owner, id: id, version: version }

}

export function cleanCache() {
    const files = fs.readdirSync(cacheDir)
    for(const f of files) {
        const stats = fs.statSync(path.join(cacheDir, f))
        const daysAgo = (Date.now() - stats.ctimeMs) / 1000 / 60 / 60 / 24
        if(daysAgo >= 7) fs.rmSync(path.join(cacheDir, f))
    }
}