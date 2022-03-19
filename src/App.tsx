import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components'
import { discordUrl } from './subpages/Discord';
import "animate.css/animate.min.css";
import ScrollAnimation from 'react-animate-on-scroll';
import PackGallery, { GalleryImage } from './components/Gallery';
import { useHistory } from 'react-router';
import { registeredPalettes, setPalette } from './shared/Palette';
import { ReactComponent as PaletteIcon } from './icons/color-palette.svg'
import Cookies from 'js-cookie';

const DownloadButton = styled.button`
  width: 148px;
  font-size: 1.25rem;
  height: 48px;
  border-radius: 4px;
`

const CategoryDiv = styled.div`
  display: flex; 
  flex-direction: column;
  align-items: center; 
  width: 100%;
`

const detectUserEnviroment: () => 'windows' | 'macos' | 'ubuntu' | 'unknown' = () => {
  const agent = navigator.userAgent
  if (agent.indexOf('Win') !== -1)
    return 'windows';
  else if (agent.indexOf('Mac') !== -1)
    return 'macos';
  else if (agent.indexOf('Linux') !== -1)
    return 'ubuntu';
  return 'unknown';
}

const downloadStable = () => {
  const os = detectUserEnviroment();
  const link = 'https://api.github.com/repos/Smithed-MC/smithed/releases/latest';
  if (os === 'unknown') window.open(link)
  fetch(link).then(async (resp) => {
    const data = await resp.json()
    console.log(data)
    for (let a of data["assets"]) {
      if (os === 'windows' && a["name"].endsWith('.exe')) {
        window.open(a["browser_download_url"])
        break;
      }
      else if (os === 'macos' && a["name"].endsWith('.dmg')) {
        window.open(a["browser_download_url"])
        break;
      }
      if (os === 'ubuntu' && a["name"].endsWith('.AppImage')) {
        window.open(a["browser_download_url"])
        break;
      }
    }
  })
}

const downloadNightly = () => {
  const os = detectUserEnviroment();

  if (os !== 'unknown')
    window.open(`https://nightly.link/Smithed-MC/smithed/workflows/build-prod/master/${os}-artifacts.zip`)
  else
    window.open(`https://nightly.link/Smithed-MC/smithed/workflows/build-prod/master`)
}

const HeaderContainer = styled.div`
  text-align: center;
  background-color: var(--darkAccent);
  width: 100%;
`


export function AppHeader(props: any) {
  const history = useHistory()
  const paletteSelect = useRef<HTMLSelectElement>(null)
  return (
    <HeaderContainer id="smithedHeader">
      <div className='flex flex-row justify-center items-center w-full'>
        <h1 onClick={() => { history.push('/') }} className='text-titlebar hover:text-gray-300 cursor-pointer' style={{ marginTop: '-8px', marginBottom: '-8px' }}>{'<SMITHED/>'}</h1>
        <PaletteIcon className={'hover:brightness-75 active:brightness-[60%] w-8 h-8 absolute right-0 mr-2'} onClick={() => {
          let ids = []
          console.log(registeredPalettes)
          for(let p in registeredPalettes) {
            ids.push(p);
          }

          const palette = Cookies.get('palette') !== undefined ? Cookies.get('palette') : 'defaultDark'
          console.log(palette)
          if(palette === undefined) return;

          const nextPaletteIdx = ids.indexOf(palette) + 1 % ids.length

          setPalette(registeredPalettes[ids[nextPaletteIdx]])
          Cookies.set('palette', ids[nextPaletteIdx])
        }}/>
      </div>
      <h3 style={{ marginTop: -16 }} hidden={props.hideSubtitle}>{'{Datapack Launcher}'}</h3>
      <div className='bg-lightAccent h-[6px]' />
    </HeaderContainer>
  )
}

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: var(--lightBackground);
`
const galleryImages: GalleryImage[] = [
  {
    url: 'https://static.planetminecraft.com/files/resource_media/screenshot/14336380-thumbnail.jpg',
    pack: 'creepermagnet_/tcc',
    name: 'The Creeper\'s Code by CreeperMagnet_'
  },
  {
    url: 'https://github.com/RagtimeGal/DnD/blob/main/other/Images/banner.png?raw=true',
    pack: 'ragno/dnd',
    name: 'Dinosaurs & Dodos by Ragno'
  },
  {
    url: 'https://static.planetminecraft.com/files/image/minecraft/data-pack/2021/125/15241252-untitled_l.webp',
    pack: 'nia_/manic',
    name: 'Manic by Nia_'
  },
  {
    url: 'https://github.com/Geegaz-Datapacks/GGDK-Data/blob/main/img/title_image.jpg?raw=true',
    pack: '',
    name: 'GGDK by Geegaz'
  },
  {
    url: 'https://static.planetminecraft.com/files/image/minecraft/data-pack/2021/863/14897790-ocean-additions-thumbnaillogo_l.webp',
    pack: '',
    name: 'Ocean Additions by Primalugly'
  },

]

function AppBody() {
  const history = useHistory();
  const [downloads, setDownloads] = useState(0)

  useEffect(() => {
    fetch('https://api.github.com/repos/TheNuclearNexus/smithed/releases').then((resp) => {
      resp.json().then((json) => {
        let downloadCount = 0
        for (let r of json) {
          for (let a of r["assets"]) {
            if (a["content_type"].includes("application/"))
              downloadCount += a["download_count"]
          }
        }
        setDownloads(downloadCount)
      })
    })
  }, [setDownloads])

  return (
    <BodyContainer>
      <CategoryDiv>
        <p className="p-2 sm:w-320 sm:p-0 md:w-480 lg:w-640" style={{ fontSize: 16 }}>
          Smithed is the all-in-one datapack launcher!
          <br />
          Focusing on both the end-user and developer experience to make datapack distribution, compatibility, and usage easier then ever! Explore interesting combinations of your favorite content!
        </p>
        <PackGallery scrollSpeed={5000} images={galleryImages} />
      </CategoryDiv>
      <CategoryDiv>
        <h3 className='text-text'>Links</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <DownloadButton onClick={() => window.open('https://wiki.smithed.dev/')}>Wiki</DownloadButton>
          <DownloadButton onClick={() => window.open(discordUrl)} style={{ backgroundColor: '#5662F6' }}>Discord</DownloadButton>
          <DownloadButton onClick={() => history.push('/libraries')}>Libraries</DownloadButton>
        </div>
      </CategoryDiv>
      <br />
      <CategoryDiv>
        <h3 className='text-text'>Download</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <DownloadButton onClick={downloadStable}>Stable</DownloadButton>
          <DownloadButton onClick={downloadNightly} style={{ backgroundColor: '#C274FF' }}>Nightly</DownloadButton>
        </div>
        <label>Downloads: {downloads}</label>
      </CategoryDiv>
    </BodyContainer>
  )
}

const AppContainer = styled.div`
  width: 100%;
  min-height: 100%;
  overflow-y: auto;
`

function App() {
  return (
    <AppContainer>
      <AppHeader />
      <br />
      <AppBody />
    </AppContainer>
  );
}

export default App;