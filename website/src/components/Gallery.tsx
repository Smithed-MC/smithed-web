import React, { useEffect, useRef, useState } from 'react'
import "animate.css/animate.min.css";
import styled from 'styled-components';
import '../index.css'
import { useHistory } from 'react-router';
import { preProcessFile } from 'typescript';
export interface GalleryImage {
    url: string,
    pack: string,
    name: string
}

interface GalleryProps {
    images: GalleryImage[],
    scrollSpeed: number,
    style?: React.CSSProperties
}



const PackImg = styled.img`
    cursor: pointer;
    :hover {
        filter: brightness(85%);
    }
    :active {
        filter: brightness(60%);
    }
`


function PackGallery(props: GalleryProps) {
    const [imgIndex, setImgIndex] = useState(Math.floor(Math.random() * props.images.length))
    const history = useHistory()
    const text = useRef(null)


    const openPackView = (img: GalleryImage) => {
        if(img.pack === '') return;

        history.push('/packs/' + img.pack)
    }

    const init = () => {
        setTimeout(() => {
            setImgIndex((imgIndex + 1) % props.images.length);
        }, props.scrollSpeed)
    }


    useEffect(init, [imgIndex, props, setImgIndex, init])

    const img = props.images[imgIndex]

    const imgClass = "w-320 h-180 md:w-480 md:h-270 lg:w-640 lg:h-360"

    // const setTextStatus = (hidden: boolean) => {
    //     if(text.current == null) return; (text.current as HTMLLabelElement).hidden = hidden
    // }

    return (
        <div className={'relative ' + imgClass} style={props.style}>
            <label className='absolute z-10 text-md m-2 px-2 md:text-lg lg:text-xl bottom-0 left-0' style={{backgroundColor:'rgba(0,0,0,0.75)'}} ref={text}>{img.name}</label>
            <PackImg className={imgClass  + ' border-4 rounded-md border-darkAccent'} onClick={() => openPackView(img)} alt='Pack' src={img.url} onAnimationEnd={(e) => {
                let img = e.target as HTMLImageElement
                img.className = imgClass
                img.style.opacity = '100'
            }}/> {/*onMouseEnter={()=>{setTextStatus(false)}} onMouseLeave={()=>{setTextStatus(true)}}*/}
        </div>
    )
}


export default PackGallery;