import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { database } from '../setup-firebase';
import JSZip from 'jszip'
import latestSemver from 'latest-semver';
import { WeldDatapackBuilder } from '../weld/datapack';
import { PackBuilder } from 'slimeball/out/util';
import DefaultResourcepackBuilder from 'slimeball/out/resourcepack';
import { AppHeader } from '../App';
const { saveAs } = require('save-as')

let datapacks: [string, Buffer][] = []
let resourcepacks: [string, Buffer][] = []


async function getPackData(uid: string, id: string) {
    const ownerPacks = (await database.ref(`users/${uid}/packs`).get()).val() as any[]

    for(let p of ownerPacks) {
        if(p.id === id) {
            return p;
        }
    }
    return null;
}

async function getLatestVersionNumber(pack: any): Promise<string|undefined> {
    let versions: string[] = []
    for(let v in pack.versions) {
        let tempV = v.replaceAll('_','.')
        versions.push('v'+tempV)
        
    }
    let version = latestSemver(versions)

    return version;
}
async function getVersionData(pack: any, version?: string): Promise<any> {
    var versionData
    if(version != null && version !== '' && pack.versions[version] != null) {
        versionData = pack.versions[version]
    } else {
        version = await getLatestVersionNumber(pack)
        if(version !== undefined) {
            versionData = pack.versions[version.replaceAll('.','_')]
        } else {
            throw new Error('Valid version could not be found!')
        }
    }
    return versionData
}

async function fetchFile(url: string): Promise<Buffer> {
    const buffer = (await (await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)).arrayBuffer())
    return buffer as Buffer;
}

async function downloadPack(entry: any, id: string, version?: string) {
    const pack = await getPackData(entry["owner"], id);
    

    const versionData = await getVersionData(pack, version)

    if(versionData != null) {
        if(versionData["downloads"] != null) {
            const {datapack, resourcepack}: {datapack: string, resourcepack: string} = versionData["downloads"]

            if(datapack !== undefined && datapack !== '') {
                const zip = await fetchFile(datapack)
                datapacks.push([id, zip])
            } 
            if(resourcepack !== undefined && resourcepack !== '') {
                const zip = await fetchFile(resourcepack)
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
    console.log('done')
}


async function startDownload(owner: string, id: string, version?: string) {
    const dbEntry = (await database.ref(`packs/${owner}:${id}`).get()).val()

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

async function downloadAndMerge(owner: string, id: string, version?: string) {
    datapacks = []
    resourcepacks = []

    await startDownload(owner, id, version)

    if(datapacks.length > 0) {
        const dpb = new WeldDatapackBuilder(await JSZip.loadAsync(await fetchFile('https://launcher.mojang.com/v1/objects/8d9b65467c7913fcf6f5b2e729d44a1e00fde150/client.jar')))
        await generateFinal(dpb, datapacks, id + '-datapack.zip')
    }
    if(resourcepacks.length > 0) {
        const rpb = new DefaultResourcepackBuilder();
        await generateFinal(rpb, resourcepacks, id + '-resourcepack.zip')
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