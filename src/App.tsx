import React from 'react';
import { palette } from '.';
import styled from 'styled-components'
import { discordUrl } from './subpages/Discord';

const AppContainer = styled.div`
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  gap: 16px;
`

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

function AppHeader() {
  return (
    <div style={{textAlign: 'center', backgroundColor: palette.darkAccent}}>
      <h1>{'<SMITHED/>'}</h1>
      <h3>{'{Datapack Launcher}'}</h3>
      <div style={{backgroundColor: palette.lightAccent, height: 6}}/>
    </div>
  )
}

function App() {  
  return (
    <AppContainer>
      <AppHeader/>
      <CategoryDiv>
        <h3 style={{color: palette.text}}>Discord</h3>
        <div style={{display:'flex',gap: 8}}>
          <DownloadButton onClick={()=>window.open(discordUrl)} style={{backgroundColor:'#5662F6'}}>Join</DownloadButton>
        </div>
      </CategoryDiv>
      <CategoryDiv>
        <h3 style={{color: palette.text}}>Download</h3>
        <div style={{display:'flex',gap: 8}}>
          <DownloadButton onClick={downloadStable}>Stable</DownloadButton>
          <DownloadButton onClick={downloadNightly} style={{backgroundColor:'#C274FF'}}>Nightly</DownloadButton>
        </div>

      </CategoryDiv>
    </AppContainer>
  );
}

export default App;
