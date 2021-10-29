import customProtocolCheck from 'protocol-checker'
import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router'
import { AppHeader } from '../App';
import { setDescription } from '../Meta';


function Packs(props: any) {
    const { owner, id }: {owner: string, id:string} = useParams()
    const history = useHistory();
    const [hidePage, setHidePage] = useState(true);

    useEffect(() => {
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

        setDescription(`View ${owner}:${id}`)
    }, [setHidePage, owner, id, history])

    return (
        <div className='flex items-center flex-col h-full' hidden={hidePage}>
            <AppHeader hideSubtitle={true}/>
            <div className='flex h-full justify-center items-center flex-col -mt-36'>
              <h3>The pack you have requested is opening up in the launcher!</h3>
              <button className='w-64 h-10' onClick={()=>{
                  history.push('/')
              }}>Go back to home page</button>
            </div>
        </div>
    )
} 

export default Packs