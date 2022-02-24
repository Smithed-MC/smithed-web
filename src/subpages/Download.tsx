import { WeldDatapackBuilder } from "../weld/datapack";
import DefaultResourcepackBuilder from "slimeball/out/resourcepack";
import JSZip from "jszip";
import { PackBuilder } from "slimeball/out/util";
import { firebaseApp } from "../setup-firebase"
import { useState, useEffect, useCallback, SetStateAction, Dispatch } from "react";
import { AppHeader } from "../App";
import { ArrayParam, BooleanParam, StringParam, useQueryParam, withDefault } from "use-query-params";
import { saveAs } from 'file-saver'
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";

let datapacks: [string, Buffer][] = []
let resourcepacks: [string, Buffer][] = []
let packIds: string[] = []
let gameVersion: string = '1.18.1'

let dpBlob: [string, Blob] = ['', new Blob()]
let rpBlob: [string, Blob] = ['', new Blob()]

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
    // console.log(version)
    // console.log(pack.versions)
    if (version != null && version !== '' && pack.versions.find((v: any) => v.name === version) != null) {
        // console.log('did we make it')
        versionData = pack.versions.find((v: any) => v.name === version)
    } else {
        let versions: { name: string, supports: string[] }[] = pack.versions;
        versionData = versions.reverse().find((v) => v.supports.includes(gameVersion))
        if (versionData == null) {
            let supports: string[] = []
            for (let v of versions)
                for (let s of v.supports)
                    if (!supports.includes(s)) supports.push(s)

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
        // console.log(e)
        return null;
    }
}

async function downloadPack(entry: any, id: string, version?: string) {
    const pack = await getPackData(entry["owner"], id);
    // console.log('made it ')
    // console.log(pack)

    const versionData = await getVersionData(pack, version)
    // console.log(versionData)
    if (versionData != null) {
        if (versionData["downloads"] != null) {
            const { datapack, resourcepack }: { datapack: string, resourcepack: string } = versionData["downloads"]
            // console.log(datapack)
            // console.log(resourcepack)
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
                // console.log(d)
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

    setStatus
    (<div>
        <h1>Downloading pack:</h1>
        <h2>{owner}:{id}</h2>
    </div>)

    if (dbEntry != null) {
        await downloadPack(dbEntry, id, version)
    }
}

async function generateFinal(builder: PackBuilder, packs: [string, Buffer][]) {
    console.log('loading')
    await builder.loadBuffers(packs)
    setStatus(<div><h1>Building</h1></div>)
    console.log('done loading\nbuilding')
    const r = await builder.build()
    console.log('done building')

    let lastPercent = 0
    const blob = await r.zip.close(undefined, {'onprogress': (p, total, entry) => {
        const percent = Math.ceil(p*100/total)
        if(lastPercent < percent) {
            console.log(percent)
            lastPercent = percent
        }
    }})
    console.log(blob)
    return blob
}

function incrementDownloads() {
    fetch(`https://vercel.smithed.dev/api/update-download?packs=${JSON.stringify(packIds)}`, { mode: 'no-cors' })
}

let bothName = ''
async function downloadZip() {
    const final = new ZipWriter(new BlobWriter("application/zip"))
    await final.add(rpBlob[0], new BlobReader(rpBlob[1]))
    await final.add(dpBlob[0], new BlobReader(dpBlob[1]))

    saveAs(await final.close(), bothName)
}

export async function downloadAndMerge(packs: { id: string, owner: string, version: string | undefined }[], auto: boolean, both: boolean, callback: () => void) {
    datapacks = []
    resourcepacks = []
    dpBlob[0] = ''
    rpBlob[0] = ''

    packIds = []

    for (let p of packs) {

        await startDownload(p.owner, p.id, p.version)
    }

    setStatus(
        <div>
            <h2>Done downloading packs</h2>
        </div>
    )

    bothName = packs.length === 1 ? `${packs[0].id}-both.zip` : `packs-both.zip`
    incrementDownloads()

    
    setStatus(
        <div>
            <h2>Incremented download counts</h2>
        </div>
    )


    if (datapacks.length > 0) {
        // const jarLink = (await firebaseApp.database().ref(`meta/vanilla/${gameVersion.replace(/[.]+/g, '_')}`).get()).val()
        // const jar = await fetchFile(jarLink);
        // if (jar != null) {
        //     console.log(jar);
        const dpb = new WeldDatapackBuilder(gameVersion)

            
        setStatus(
            <div>
                <h1>Starting to merge datapacks</h1>
            </div>
        )

        const blob = await generateFinal(dpb, datapacks)
        const name = packs.length === 1 ? `${packs[0].id}-datapack.zip` : 'datapacks.zip'
        if (auto && !(both && resourcepacks.length > 0)) saveAs(blob, name)
        else dpBlob = [name, blob]
        console.log('done')
            
        setStatus(
            <div>
                <h1>Finished merging datapacks</h1>
            </div>
        )

        // }
    }
    if (resourcepacks.length > 0) {

                    
        setStatus(
            <div>
                <h1>Started to merge resourcepacks</h1>
            </div>
        )

        const rpb = new DefaultResourcepackBuilder();

        const blob = await generateFinal(rpb, resourcepacks)
        const name = packs.length === 1 ? `${packs[0].id}-resourcepack.zip` : 'resourcepack.zip'
        if (auto && !(both && datapacks.length > 0)) saveAs(blob, name)
        else rpBlob = [name, blob]

                    
        setStatus(
            <div>
                <h1>Finished merging resourcepacks</h1>
            </div>
        )
    }
    if (auto && both) {
        downloadZip();
    }
    callback()
}

let [status, setStatus] = [<></>, {} as Dispatch<SetStateAction<JSX.Element>>]

function Download(props: any) {
    // const { owner, id, version }: {owner: string, id:string, version:string} = useParams()
    [status, setStatus] = useState(<div className="flex items-center flex-col">
        <h1>Downloading packs!</h1>
        <h2>This may take a few seconds!</h2>
    </div>)
    const [packs] = useQueryParam('pack', ArrayParam)
    const [version] = useQueryParam('version', StringParam)
    const [auto] = useQueryParam('auto', withDefault(BooleanParam, false))
    const [both] = useQueryParam('both', withDefault(BooleanParam, true))

    // console.log(auto)
    // console.log(version)
    // console.log(packs)

    const packStringToObject = useCallback((pack: string) => {
        const owner = pack.split(':')[0]
        const splitAt = pack.split(':')[1].split('@')
        const id = splitAt[0]
        const version = splitAt.length > 1 && splitAt[1] !== '' ? decodeURIComponent(splitAt[1]) : undefined;
        return { id: id, owner: owner, version: version }
    }, [])

    useEffect(() => {
        if (version != null && version !== '')
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


        downloadAndMerge(finalPacks, auto, both, () => {
            let completeText = []
            for (let p of packIds)
                completeText.push(<label className="text-2xl">{p}</label>)
                console.log('done')
            setStatus(
                <div className="flex flex-col items-center w-1/4">
                    {!auto && <div className="flex flex-col items-center w-full">
                        <h2>Download</h2>
                        <div className="flex flex-row w-full h-full justify-center gap-2 mb-2">
                            {dpBlob[0] !== '' && <button className="w-1/2 h-10" onClick={() => saveAs(dpBlob[1], dpBlob[0])}>Datapack</button>}
                            {rpBlob[0] !== '' && <button className="w-1/2 h-10" onClick={() => saveAs(rpBlob[1], rpBlob[0])}>Resourcepack</button>}
                        </div>
                        <div className="flex flex-row w-full h-full justify-center gap-2">
                            {rpBlob[0] !== '' && dpBlob[0] !== '' && <button className="w-1/2 h-10" onClick={() => {
                                downloadZip();
                            }}>Both</button>}
                        </div>

                    </div>}
                    <h2>{`Contents`}</h2>
                    <div className="flex flex-col">
                        {completeText}
                    </div>
                </div>
            )
        })
    }, [packs, packStringToObject, version, auto, both])

    return (
        <div className='flex items-center flex-col h-full'>
            <AppHeader hideSubtitle={true} />
            {status}
        </div>
    )
}

export default Download