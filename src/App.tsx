import React from 'react';
import { palette } from './Palette'; 
import styled from 'styled-components'
import { discordUrl } from './subpages/Discord';
import "animate.css/animate.min.css";
import ScrollAnimation from 'react-animate-on-scroll';
import PackGallery, { GalleryImage } from './components/Gallery';

const DownloadButton = styled.button`
  width: 128px;
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

const detectUserEnviroment: () => 'windows'|'macos'|'ubuntu'|'unknown' = () => {
  const agent = navigator.userAgent
  if(agent.indexOf('Win') !== -1)
    return 'windows';
  else if(agent.indexOf('Mac') !== -1)
    return 'macos';
  else if(agent.indexOf('Linux') !== -1)
    return 'ubuntu';
  return 'unknown'; 
}

const downloadStable = () => {
  const os = detectUserEnviroment();
  const link = 'https://api.github.com/repos/TheNuclearNexus/smithed/releases/latest';
  if(os === 'unknown') window.open(link)
  fetch(link).then(async (resp) => {
    const data = await resp.json()
    console.log(data)
    for(let a of data["assets"]) {
      if(os === 'windows' && a["name"].endsWith('.exe')) {
        window.open(a["browser_download_url"])
        break;
      }
      else if(os === 'macos' && a["name"].endsWith('.dmg')) {
        window.open(a["browser_download_url"])
        break;
      }
      if(os === 'ubuntu' && a["name"].endsWith('.AppImage')) {
        window.open(a["browser_download_url"])
        break;
      }
    }
  })
}

const downloadNightly = () => {
  const os = detectUserEnviroment();

  if(os !== 'unknown')
    window.open(`https://nightly.link/TheNuclearNexus/smithed/workflows/build-prod/master/${os}-artifacts.zip`)
  else
    window.open(`https://nightly.link/TheNuclearNexus/smithed/workflows/build-prod/master`)
}

const HeaderContainer = styled.div`
  text-align: center;
  background-color: ${palette.darkAccent};
`


function AppHeader() {
  return (
    <ScrollAnimation animateIn='animate__slideInDown' animateOnce={true} offset={0} duration={1}>
      <HeaderContainer id="smithedHeader">
        <h1>{'<SMITHED/>'}</h1>
        <h3 id="smithedHeaderSubtitle">{'{Datapack Launcher}'}</h3>
        <div style={{backgroundColor: palette.lightAccent, height: 6}}/>
      </HeaderContainer>
    </ScrollAnimation>
  )
}

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const galleryImages: GalleryImage[] = [
  {
    url:'https://github.com/Geegaz-Datapacks/GGDK-Data/blob/main/img/title_image.jpg?raw=true',
    pack:'geegaz/ggdk'
  },
  {
    url:'https://static.planetminecraft.com/files/resource_media/screenshot/14336380-thumbnail.jpg',
    pack:'creepermagnet/tcc'
  }
]

function AppBody() {
  return (
    <BodyContainer>
      <ScrollAnimation animateIn='animate__fadeInUp' delay={1250} animateOnce={true}>
        <CategoryDiv> 
          <p className="p-2 sm:w-320 sm:p-0 md:w-480 lg:w-640" style={{fontSize: 16}}>
            Smithed is the all-in-one datapack launcher! 
            <br/>
            Focusing on both the end-user and developer experience to make datapack distribution, compatibility, and useage easier then ever! Explore interesting combinations of your favorite content!
          </p>
          <PackGallery scrollSpeed={5000} images={galleryImages}/>          
        </CategoryDiv>
      </ScrollAnimation>
      <ScrollAnimation animateIn='animate__fadeInUp' delay={1500} animateOnce={true}>
        <CategoryDiv>
          <h3 style={{color: palette.text}}>Links</h3>
          <div style={{display:'flex',gap: 8}}>
            <DownloadButton onClick={()=>window.open('https://wiki.smithed.dev/')}>Wiki</DownloadButton>
            <DownloadButton onClick={()=>window.open(discordUrl)} style={{backgroundColor:'#5662F6'}}>Discord</DownloadButton>
          </div>
        </CategoryDiv>
        <br/>
        <CategoryDiv>
          <h3 style={{color: palette.text}}>Download</h3>
          <div style={{display:'flex',gap: 8}}>
            <DownloadButton onClick={downloadStable}>Stable</DownloadButton>
            <DownloadButton onClick={downloadNightly} style={{backgroundColor:'#C274FF'}}>Nightly</DownloadButton>
          </div>

        </CategoryDiv>
      </ScrollAnimation>
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
      <AppHeader/>
      <br/>
      <AppBody/>
    </AppContainer>
  );
}

export default App;
