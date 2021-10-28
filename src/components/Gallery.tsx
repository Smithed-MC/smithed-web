import React, { useEffect, useRef, useState } from 'react'
import "animate.css/animate.min.css";
import customProtocolCheck from 'protocol-checker';
import styled from 'styled-components';
export interface GalleryImage {
    url: string,
    pack: string
}

interface GalleryProps {
    images: GalleryImage[],
    scrollSpeed: number,
    style?: React.CSSProperties
    width: number|string,
    height: number|string
}



const PackImg = styled.img`
    :hover {
        filter: brightness(85%);
    }
    :active {
        filter: brightness(60%);
    }
`

function PackGallery(props: GalleryProps) {
    const [imgIndex, setImgIndex] = useState(0)
    const [mouseOver, setMouseOver] = useState(false)
    const displayImg = useRef(null)
    const backupImg = useRef(null)


    const openPackView = (img: GalleryImage) => {
        customProtocolCheck(
            `smithed://packs/${img.pack}`,
            () => {
                alert('You haven\'t installed Smithed!')
            }
        )
    }

    const applyFade = () => {
        const cur = displayImg.current
        if(cur != null) {
            const imgRef = cur as HTMLImageElement

            imgRef.className = "animate__animated animate__fadeIn"
        }
    }

    const init = () => {
        console.log(props.images)
        setTimeout(() => {
            if(mouseOver) {
                init();
                return;
            }

            const cur = backupImg.current;
            if(cur != null) {
                const ref = cur as HTMLImageElement;

                if(displayImg.current != null) {
                    let og = (displayImg.current as HTMLImageElement)
                    og.style.opacity = '0'
                    ref.src = og.src
                }
            }
            setImgIndex((imgIndex + 1) % props.images.length);
        }, props.scrollSpeed)
    }

    useEffect(()=>{applyFade();})
    
    useEffect(init, [imgIndex, props, setImgIndex, backupImg, mouseOver, init])
    
    const img = props.images[imgIndex]

    let style = props.style
    if(style == null) style = {width: props.width, height:props.height}

    return (
        <div style={style}>
            <img style={{position:'absolute',zIndex:0}} alt='' ref={backupImg} width={props.width} height={props.height}/>
            <PackImg style={{position:'absolute',zIndex:1,animationDelay:'0.2s'}} onClick={()=>openPackView(img)} onMouseOver={()=>setMouseOver(true)} onMouseLeave={()=>setMouseOver(false)} ref={displayImg} alt='Pack' src={img.url} width={props.width} height={props.height} onAnimationEnd={(e) => {
                let img = e.target as HTMLImageElement
                img.className = ""    
                img.style.opacity = '100'
            }}/>
        </div>
    )
}

export default PackGallery;