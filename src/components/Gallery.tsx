import React, { useEffect, useRef, useState } from 'react'
import "animate.css/animate.min.css";
import customProtocolCheck from 'protocol-checker';
import styled from 'styled-components';
import '../index.css'
export interface GalleryImage {
    url: string,
    pack: string
}

interface GalleryProps {
    images: GalleryImage[],
    scrollSpeed: number,
    style?: React.CSSProperties
}



const PackImg = styled.img`
    :hover {
        filter: brightness(85%);
    }
    :active {
        filter: brightness(60%);
    }
`

const animationClass = "animate__animated animate__fadeIn "

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

            imgRef.className = animationClass + imgRef.className
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
                    ref.hidden = false
                }
            }
            setImgIndex((imgIndex + 1) % props.images.length);
        }, props.scrollSpeed)
    }

    useEffect(()=>{applyFade();})
    
    useEffect(init, [imgIndex, props, setImgIndex, backupImg, mouseOver, init])
    
    const img = props.images[imgIndex]

    const imgClass = "w-320 h-180 md:w-480 md:h-270 lg:w-640 lg:h-360"

    return (
        <div className={imgClass} style={props.style}>
            <img className={imgClass} style={{position:'absolute',zIndex:0}} alt='' ref={backupImg}/>
            <PackImg className={imgClass} style={{position:'absolute',zIndex:1,animationDelay:'0.2s'}} onClick={()=>openPackView(img)} onMouseOver={()=>setMouseOver(true)} onMouseLeave={()=>setMouseOver(false)} ref={displayImg} alt='Pack' src={img.url} onAnimationEnd={(e) => {
                let img = e.target as HTMLImageElement
                img.className = imgClass
                img.style.opacity = '100'

                if(backupImg.current != null) {
                    (backupImg.current as HTMLImageElement).hidden = true
                }
            }}/>
        </div>
    )
}

export default PackGallery;