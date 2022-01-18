import { WeldDatapackBuilder } from "../weld/datapack";
import DefaultResourcepackBuilder from "slimeball/out/resourcepack";
import JSZip from "jszip";
import { PackBuilder } from "slimeball/out/util";
import { firebaseApp } from "../setup-firebase"
import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "../App";
import { ArrayParam, StringParam, useQueryParam } from "use-query-params";

const { saveAs } = require('save-as')

let datapacks: [string, Buffer][] = []
let resourcepacks: [string, Buffer][] = []
let packIds: string[] = []
let gameVersion: string = '1.18.1'

async function getPackData(uid: string, id: string) {
    const ownerPacks = (await firebaseApp.database().ref(`users/${uid}/packs`).get()).val() as any[]

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
async function getVersionData(pack: any, version?: string): Promise<any> {
    var versionData
    console.log(version)
    console.log(pack.versions)
    if (version != null && version !== '' && pack.versions.find((v: any) => v.name === version) != null) {
        console.log('did we make it')
        versionData = pack.versions.find((v: any) => v.name === version)
    } else {
        let versions: {name: string, supports: string[]}[] = pack.versions;
        versionData = versions.reverse().find((v) => v.supports.includes(gameVersion))
        if(versionData == null) {
            let supports: string[] = []
            for(let v of versions)
                for(let s of v.supports)
                    if(!supports.includes(s)) supports.push(s)

            alert(`Valid version could not be found for pack '${pack.id}' on Minecraft Version ${gameVersion}!\n'${pack.id}' supports: ${supports.join(', ')}\nTry adding '&version=<gameVersion>' to resolve the issue!`)
            return null
        }
    }
    return versionData
}

async function fetchFile(url: string): Promise<Buffer | null> {
    try {
        const resp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
        if (resp.ok) {
            const buffer = await resp.arrayBuffer()
            return buffer as Buffer;
        } else {
            throw new Error(`Error while downloading pack! ${resp.json()}`)
        }
    } catch (e: any) {
        console.log(e)
        return null;
    }
}

async function downloadPack(entry: any, id: string, version?: string) {
    const pack = await getPackData(entry["owner"], id);
    console.log('made it ')
    console.log(pack)

    const versionData = await getVersionData(pack, version)
    console.log(versionData)
    if (versionData != null) {
        if (versionData["downloads"] != null) {
            const { datapack, resourcepack }: { datapack: string, resourcepack: string } = versionData["downloads"]
            console.log(datapack)
            console.log(resourcepack)
            if (datapack !== undefined && datapack !== '') {
                const zip = await fetchFile(datapack)
                if (zip != null)
                    datapacks.push([id, zip])
            }
            if (resourcepack !== undefined && resourcepack !== '') {
                const zip = await fetchFile(resourcepack)
                if (zip != null)
                    resourcepacks.push([id, zip])
            }
        }

        if (versionData["dependencies"] != null && versionData["dependencies"].length > 0) {
            for (var d of versionData["dependencies"]) {
                console.log(d)
                const [owner, id] = d.id.split(':')
                const version = d.version
                await startDownload(owner, id, version)
            }
        }
    }
}


async function startDownload(owner: string, id: string, version?: string) {
    const dbEntry = (await firebaseApp.database().ref(`packs/${owner}:${id}`).get()).val()
    packIds.push(owner + ':' + id)

    if (dbEntry != null) {
        await downloadPack(dbEntry, id, version)
    }
}

async function generateFinal(builder: PackBuilder, packs: [string, Buffer][], name: string) {
    await builder.loadBuffers(packs)
    await builder.build(async (r) => {
        await saveAs(await r.zip.generateAsync({ type: 'blob' }), name)
    })
}

function incrementDownloads() {
    fetch(`https://vercel.smithed.dev/api/update-download?packs=${JSON.stringify(packIds)}`, { mode: 'no-cors' })
}

export async function downloadAndMerge(packs: { id: string, owner: string, version: string | undefined }[], callback: () => void) {
    datapacks = []
    resourcepacks = []

    packIds = []

    for (let p of packs) {
        await startDownload(p.owner, p.id, p.version)
    }

    incrementDownloads()

    if (datapacks.length > 0) {
        const jarLink = (await firebaseApp.database().ref(`meta/vanilla/${gameVersion.replace(/[.]+/g, '_')}`).get()).val()
        const jar = await fetchFile(jarLink);
        if (jar != null) {
            console.log(jar);
            const dpb = new WeldDatapackBuilder(await JSZip.loadAsync(jar))
            await generateFinal(dpb, datapacks, packs.length === 1 ? `${packs[0].id}-datapack.zip` : 'datapacks.zip')
        }
    }
    if (resourcepacks.length > 0) {
        const rpb = new DefaultResourcepackBuilder();
        await generateFinal(rpb, resourcepacks, packs.length === 1 ? `${packs[0].id}-resourcepack.zip` : 'resourcepacks.zip')
    }

    callback()
}


function Download(props: any) {
    // const { owner, id, version }: {owner: string, id:string, version:string} = useParams()
    const [status, setStatus] = useState(<></> as JSX.Element)
    const [packs] = useQueryParam('pack', ArrayParam)
    const [version] = useQueryParam('version', StringParam)

    console.log(version)
    console.log(packs)

    const packStringToObject = useCallback((pack: string) => {
        const owner = pack.split(':')[0]
        const splitAt = pack.split(':')[1].split('@')
        const id = splitAt[0]
        const version = splitAt.length > 1 && splitAt[1] !== '' ? splitAt[1] : undefined;
        return { id: id, owner: owner, version: version }
    }, [])

    useEffect(() => {
        if(version != null && version !== '')
            gameVersion = version
        else
            gameVersion = '1.18.1'

        let finalPacks = []
        if (packs == null || packs.length === 0) {
            setStatus(<label>{'No packs provided in URL'}</label>)
            return
        }

        for (let p of packs) {
            if (p == null) continue;
            finalPacks.push(packStringToObject(p))
        }


        downloadAndMerge(finalPacks, () => {
            let completeText = [<h2>{`Done downloading:`}</h2>]
            for (let p of packIds)
                completeText.push(<label className="text-2xl">{' - ' + p}</label>)
            setStatus(
                <div className="flex flex-col">
                    {completeText}
                </div>
            )
        })
    }, [packs, packStringToObject, version])

    return (
        <div className='flex items-center flex-col h-full'>
            <AppHeader hideSubtitle={true} />
            {status}
        </div>
    )
}

export default Download