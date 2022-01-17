import { WeldDatapackBuilder } from "../weld/datapack";
import DefaultResourcepackBuilder from "slimeball/out/resourcepack";
import JSZip from "jszip";
import { PackBuilder } from "slimeball/out/util";
import { firebaseApp } from "../setup-firebase"
import latestSemver from "latest-semver";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { AppHeader } from "../App";

const { saveAs } = require('save-as')

let datapacks: [string, Buffer][] = []
let resourcepacks: [string, Buffer][] = []
let packIds: string[] = []


async function getPackData(uid: string, id: string) {
    const ownerPacks = (await firebaseApp.database().ref(`users/${uid}/packs`).get()).val() as any[]

    for(let p of ownerPacks) {
        if(p.id === id) {
            if(p.versions instanceof Array) {
                return p;
            } else {
                let versions: any[] = []
                for(let v in p.versions) {
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

async function getLatestVersionNumber(pack: any): Promise<string|undefined> {
    return pack.versions[pack.versions.length - 1].name;
}
async function getVersionData(pack: any, version?: string): Promise<any> {
    var versionData
    console.log(version)
    console.log(pack.versions)
    if(version != null && version !== '' && pack.versions.find((v: any) => v.name === version) != null) {
        console.log('did we make it')
        versionData = pack.versions.find((v: any) => v.name === version)
    } else {
        version = await getLatestVersionNumber(pack)
        console.log(version)
        if(version !== undefined) {
            versionData = pack.versions.find((v: any) => v.name === version)
        } else {
            throw new Error('Valid version could not be found!')
        }
    }
    return versionData
}

async function fetchFile(url: string): Promise<Buffer|null> {
    try {
        const resp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
        if(resp.ok) {
            const buffer = await resp.arrayBuffer()
            return buffer as Buffer;
        } else {
            throw `Error while downloading pack! ${resp.json()}`
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
    if(versionData != null) {
        if(versionData["downloads"] != null) {
            const {datapack, resourcepack}: {datapack: string, resourcepack: string} = versionData["downloads"]
            console.log(datapack)
            console.log(resourcepack)
            if(datapack !== undefined && datapack !== '') {
                const zip = await fetchFile(datapack)
                if(zip != null)
                    datapacks.push([id, zip])
            } 
            if(resourcepack !== undefined && resourcepack !== '') {
                const zip = await fetchFile(resourcepack)
                if(zip != null)
                    resourcepacks.push([id, zip])
            } 
        }

        if(versionData["dependencies"] != null && versionData["dependencies"].length > 0) {
            for(var d of versionData["dependencies"]) {
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

    if(dbEntry != null) {
        await downloadPack(dbEntry, id, version)
    }
}

async function generateFinal(builder: PackBuilder, packs: [string, Buffer][], name: string) {
    await builder.loadBuffers(packs)
    await builder.build(async (r) => {      
        await saveAs(await r.zip.generateAsync({type:'blob'}), name)
    })
}

function incrementDownloads() {
    fetch(`https://vercel.smithed.dev/api/update-download?packs=${JSON.stringify(packIds)}`, {mode:'no-cors'})
}

export async function downloadAndMerge(owner: string, id: string, version: string) {
    datapacks = []
    resourcepacks = []

    packIds = []

    await startDownload(owner, id, version)
    
    incrementDownloads()

    if(datapacks.length > 0) {
        const jarLink = (await firebaseApp.database().ref(`meta/vanilla/1_18_1`).get()).val()
        const jar = await fetchFile(jarLink);
        if(jar != null) {
            console.log(jar);
            const dpb = new WeldDatapackBuilder(await JSZip.loadAsync(jar))
            await generateFinal(dpb, datapacks, `${id}-datapack.zip`)
        }
    }
    if(resourcepacks.length > 0) {
        const rpb = new DefaultResourcepackBuilder();
        await generateFinal(rpb, resourcepacks, `${id}-resourcepack.zip`)
    }

}


function Download(props: any) {
    const { owner, id, version }: {owner: string, id:string, version:string} = useParams()
    const [status, setStatus] = useState('')

    useEffect(()=>{
        setStatus(`Downloading ${id}`)
        downloadAndMerge(owner, id, version).then(() => {
            setStatus(`Done! You can close this window`)
        })
    }, [owner, id, version])

    return (
        <div className='flex items-center flex-col h-full'>
            <AppHeader hideSubtitle={true}/>
            <h2>{status}</h2>
        </div>
    )
} 

export default Download