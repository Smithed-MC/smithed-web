import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "../App";
import { ArrayParam, BooleanParam, StringParam, useQueryParam, withDefault } from "use-query-params";
import PackDownloader from "../shared/PackDownload";
import { ZipWriter, BlobWriter, BlobReader } from "@zip.js/zip.js";
import saveAs from "file-saver";

let oldSubtitle = ''
function Download(props: any) {
    // const { owner, id, version }: {owner: string, id:string, version:string} = useParams()
    const [status, setStatus] = useState(<div className="flex items-center flex-col">
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

    const packStringToObject = useCallback((pack: string): { id: string, owner: string, version?: string } => {
        const owner = pack.split(':')[0]
        const splitAt = pack.split(':')[1].split('@')
        const id = splitAt[0]
        const version = splitAt.length > 1 && splitAt[1] !== '' ? decodeURIComponent(splitAt[1]) : undefined;
        return { id: id, owner: owner, version: version }
    }, [])

    useEffect(() => {

        (async () => {
            if (version != null && version !== '')
                var gameVersion = version
            else
                var gameVersion = '1.18.1'

            let finalPacks: { id: string, owner: string, version?: string }[] = []
            if (packs == null || packs.length === 0) {
                setStatus(<label>{'No packs provided in URL'}</label>)
                return
            }

            for (let p of packs) {
                if (p == null) continue;
                finalPacks.push(packStringToObject(p))
            }

            const downloadZip = async (dpBlob: [string, Blob], rpBlob: [string, Blob], packIds: string[]) => {
                const final = new ZipWriter(new BlobWriter("application/zip"))
                await final.add(rpBlob[0], new BlobReader(rpBlob[1]))
                await final.add(dpBlob[0], new BlobReader(dpBlob[1]))

                saveAs(await final.close(), finalPacks.length === 1 ? `${finalPacks[0].id}-both.zip` : 'packs-both.zip')
            }

            await (new PackDownloader((m: string, spam?: boolean) => {
                // if(spam) return;
                const lines = m.split('\n', 3)
                const header = lines[0]
                let subtitle = lines.length > 1 ? lines[1] : ''
                if(spam && lines[1].includes('/')) {
                    const parts = lines[1].split('/').slice(1)
                    subtitle = `${parts[0]}:${parts.slice(1, parts.length <= 5 ? undefined : 3).join('/')}`
                    if(subtitle.length > 30) subtitle = subtitle.substring(0, 30) + '...'
                    if(subtitle === oldSubtitle) return
                    oldSubtitle = subtitle
                }
                const misc = lines.length > 2 ? lines[2] : ''
                setStatus(<div className="flex flex-col items-center">
                    <h1>{header}</h1>
                    <h2>{subtitle}</h2>
                    <p>{misc}</p>
                </div>)
            }, gameVersion).downloadAndMerge(finalPacks, (dpBlob, rpBlob, packIds) => {
                if (auto) {
                    if (both) {
                        downloadZip(dpBlob, rpBlob, packIds)
                        return
                    }
                    saveAs(dpBlob[1], dpBlob[0])
                    saveAs(rpBlob[1], rpBlob[0])
                    return
                }
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
                                    downloadZip(dpBlob, rpBlob, packIds);
                                }}>Both</button>}
                            </div>

                        </div>}
                        <h2>{`Contents`}</h2>
                        <div className="flex flex-col">
                            {completeText}
                        </div>
                    </div>
                )
            }))
        })()
    }, [packs, packStringToObject, version, auto, both])

    return (
        <div className='flex items-center flex-col h-full'>
            <AppHeader hideSubtitle={true} />
            {status}
        </div>
    )
}

export default Download