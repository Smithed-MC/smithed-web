import React from 'react';
import { palette } from '.';
import styled from 'styled-components'

const AppContainer = styled.div`
  height: 100%;
  width: 100%;
`

const DownloadButton = styled.button`
  width: 196px;
  font-size: 2rem;
  height: 48px;
  border-radius: 4px;
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

function App() {
  return (
    <AppContainer>
      <div style={{textAlign: 'center', backgroundColor: palette.darkAccent}}>
        <h1>{'<SMITHED/>'}</h1>
        <h2>{'{Datapack Launcher}'}</h2>
        <div style={{backgroundColor: palette.lightAccent, height: 6}}/>
      </div>
      <br/>
      <div style={{display: 'flex', flexDirection:'column', alignItems:'center', width: '100%'}}>
        <h2 style={{color: palette.text}}>Download</h2>
        <div style={{display:'flex',gap: 8}}>
          <DownloadButton onClick={downloadStable}>Stable</DownloadButton>
          <DownloadButton onClick={downloadNightly} style={{backgroundColor:'#C274FF'}}>Nightly</DownloadButton>
        </div>

      </div>
    </AppContainer>
  );
}

export default App;
