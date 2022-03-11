import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { AppHeader } from "../App";
import '../index.css'
import Markdown from "markdown-to-jsx";
import { MarkdownOptions } from "../shared/Markdown";


function formatId(id: string) {
    const bits = id.split('-')
    bits.forEach((p, i, arr) => arr[i] = p.charAt(0).toUpperCase() + p.substring(1))
    return bits.join(' ')
}

function LibraryPane(props: { pack: Package }) {
    const history = useHistory()
    const pack = props.pack

    const name = formatId(pack.id)
    const slug = `${pack.version}@${pack.version}`


    return (
        <div className="w-[480px] h-auto flex flex-col items-center p-2 gap-2 bg-lightBackground border-lightAccent border-2 rounded-md">
            <div className="flex flex-row gap-2 items-center">
                {pack.badges != undefined && (() => {
                    let elements: JSX.Element[] = []

                    for (let b of pack.badges) {
                        elements.push(
                            <div>
                                <label className='rounded-md bg-lightAccent p-1 h-auto text-sm font-[Inconsolata]'>{formatId(b)}</label>
                            </div>
                        )
                    }

                    return elements
                })()}
                <label className="text-center text-2xl" style={{ fontFamily: 'Disket-Bold' }}>{name}
                    <label className="text-center text-xl text-subText font-[Inconsolata]"> {pack.version}</label>
                </label>
            </div>
            <hr className="bg-text w-full" />
            <Markdown options={MarkdownOptions()} className="flex-grow text-center w-full bg-darkBackground rounded-md p-2">{pack.description}</Markdown>
            <br />
            <div className="flex flex-wrap gap-2 place-content-center">
                <button className="w-32 h-8 text-xl" onClick={() => history.push('/download?pack=smithed:' + slug)}>Download</button>
                <button className="w-32 h-8 text-xl" onClick={() => history.push('/packs/smithed/' + slug)}>View</button>
                {/* <button className="w-32 h-8 text-xl" onClick={() => window.open(props.source)}>Source</button> */}
                {/* <button className="w-32 h-8 text-xl" onClick={() => window.open(props.docs)}>Docs</button> */}
            </div>
        </div>
    )
}

const packagesJsonLink = encodeURIComponent('https://raw.githubusercontent.com/Smithed-MC/Libraries/main/packages.json')

interface Package {
    id: string,
    version: string,
    description: string,
    badges?: string[]
}


function Libraries() {
    const [packs, setPacks] = useState<Package[]>()

    useEffect(() => {
        (async () => {
            const packages: Package[] = await (await fetch(`https://api.allorigins.win/raw?url=${packagesJsonLink}`)).json()
            setPacks(packages)
        })()
    }, [setPacks]);

    if (packs === undefined) return (
        <div>
            <AppHeader hideSubtitle={true} />
            <h1>No libraries found!</h1>
        </div>
    )

    return (
        <div>
            <AppHeader hideSubtitle={true} />
            <div className="w-full h-full p-4 flex place-content-center gap-4 flex-wrap">
                {(() => {
                    let panes: JSX.Element[] = []

                    for (let p of packs) {
                        panes.push(<LibraryPane pack={p} />)
                    }

                    return panes
                })()}
            </div>
        </div>
    );
}

export default Libraries;