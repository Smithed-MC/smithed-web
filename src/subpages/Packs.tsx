import customProtocolCheck from 'protocol-checker'
import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router'
import { AppHeader } from '../App';
import { database } from '../setup-firebase';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import styled from 'styled-components';
import { palette } from '../Palette';


interface VersionData {
    name: '',
    supports: string[]
}

interface PackData {
    name: '',
    icon: '',
    webPage: '',
    description: '',
    versions: VersionData[]
}

function Packs(props: any) {
    const { owner, id }: { owner: string, id: string } = useParams()
    const history = useHistory();
    const [hidePage, setHidePage] = useState(true);
    const [packData, setPackData] = useState({} as PackData);
    const [maxVersions, setMaxVersions] = useState(5)

    const protocol = () => {
        customProtocolCheck(
            `smithed://packs/${owner}/${id}`,
            () => {
                alert('You haven\'t installed Smithed!')
                history.replace('/')
            },
            () => {
                setHidePage(false)
            }
        )
    }

    useEffect(() => {
        database.ref(`/packs/${owner}:${id}`).get().then(async (snap) => {
            console.log(snap.val())
            if (!snap.exists()) return;
            const uid = snap.val().owner
            const packs = await database.ref(`/users/${uid}/packs`).get()

            if (!packs.exists) return;
            for (let p of packs.val()) {
                if (p.id === id) {
                    p.display.versions = p.versions
                    console.log(p.versions)
                    if (p.display.webPage === '') {
                        p.display.webPage = p.display.description
                        setPackData(p.display)
                        return;
                    }

                    fetch(p.display.webPage, { cache: "no-store" }).then((resp) => {
                        if (resp.status === 200) {
                            resp.text().then(v => {
                                p.display.webPage = v
                                console.log(v)
                                setPackData(p.display)
                            })
                        } else {
                            throw resp.status
                        }
                    })
                }
            }

        })
    }, [owner, id, setPackData])

    const generateDownloads = () => {
        let versionElements: JSX.Element[] = []
        let versions = packData.versions

        for (let i = 0; i < versions.length && i < maxVersions; i++) {
            const v = versions[versions.length - i - 1]

            versionElements.push(<div className='flex flex-col items-center w-full'>
                <h3 style={{ color: 'white' }}>{v.name}</h3>
                <div className='flex flex-row justify-between w-2/3'>
                    <label className='p-2 rounded-md' style={{ backgroundColor: palette.lightBackground }}>{v.supports.join(', ')}</label>
                    <button className='p-2 rounded-md'>DOWNLOAD</button>
                </div>
            </div>)
            
        }
        return versionElements;
    }

    const markdown: MarkdownToJSX.Options = {
        overrides: {
            h1: <h1 style={{ fontSize: '2.5rem' }}></h1>,
            h2: <h2 style={{ fontSize: '2rem', color: 'white' }}><hr /></h2>,
            h3: <h3 style={{ fontSize: '1.5rem', color: 'white' }}><hr /></h3>,
            pre: styled.pre`background-color: #24232B; padding: 8px; border-radius: 4px;`
        }
    }

    if (packData.versions === undefined) return (<div className='flex flex-col justify-center w-full'>
        <AppHeader hideSubtitle={true} />
        <h1>Loading...</h1>
    </div>)



    return (
        <div className='flex flex-col gap-4'>
            <AppHeader hideSubtitle={true} />
            <div className='flex flex-row'>
                <div style={{ flex: '25%' }}>
                    {/* {renderSupport()} */}
                </div>
                <div className='flex flex-col gap-2 w-1/2'>
                    <div className='flex w-full gap-2 justify-left'>
                        <img style={{ width: 64, height: 64, border: `4px solid #1B48C4`, borderRadius: 8 }} src={packData.icon} alt="Pack Icon" />
                        <label style={{ fontFamily: 'Disket-Bold', fontSize: 18, alignSelf: 'center', width: '100%', WebkitUserSelect: 'none' }}>{packData.name}</label>
                    </div>
                    <div className='w-full h-1' style={{ backgroundColor: '#1B48C4', borderRadius: 8 }}></div>
                    <Markdown style={{ width: '100%', marginBottom: 8, fontFamily: 'Inconsolata', padding: 8, borderRadius: 4, backgroundColor: palette.darkBackground }} options={markdown}>
                        {packData.webPage}
                    </Markdown>
                </div>
                <div className='flex w-1/4 justify-center px-4'>
                    <div className='flex flex-col p-2 w-full items-center' style={{ borderRadius: 8, border: `4px solid #1B48C4`, backgroundColor: palette.darkBackground }}>

                        <h2 style={{ color: 'white' }}>Downloads</h2>
                        <hr className='w-full h-2' />
                        <button className='p-2 rounded-md w-1/2 mb-2' onClick={() => protocol()}>VIEW IN SMITHED</button>
                        <button className='p-2 rounded-md w-1/2 mb-2' onClick={() => {
                            const supports = packData.versions[packData.versions.length - 1].supports
                            history.push(`/download?pack=${owner}:${id}&version=${supports[0]}`)
                        }}>DOWNLOAD LATEST</button>
                        {generateDownloads()}
                        {packData.versions.length > maxVersions && <button className='p-2 w-1/2 mt-2' onClick={() => { setMaxVersions(maxVersions + 5) }}>SHOW MORE</button>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Packs