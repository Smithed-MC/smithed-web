function fixBlob(matches: RegExpExecArray, user: string, repo: string) {
    const path = matches.shift()

    return `https://raw.githubusercontent.com/${user}/${repo}/${path}`
}

async function fixRelease(matches: RegExpExecArray, user: string, repo: string) {
    const remainder = matches.shift();
    if(remainder === undefined) return undefined
    const [tag, assetName] = remainder.split('/').slice(1);
    console.log(tag,assetName)

    const fetchURL = `https://api.github.com/repos/${user}/${repo}/releases`
    console.log(fetchURL)
    const APIResp = await fetch(fetchURL)
    const APIData = await APIResp.json() as any[];
    const release = APIData.find(r => r.tag_name === tag);
    if(release === undefined) return undefined
    const asset = release.assets.find((a: any) => a.name === assetName)
    if(asset === undefined) return undefined

    return asset.url;
}

export async function correctGithubLink(url: string): Promise<string> {
    const matches = /(https:\/\/)?(www\.)?github\.com\/(\S[^\/]+)\/(\S[^\/]+)\/(\S[^\/]+)\/(\S[^?\s]+)/g.exec(url)
    // console.log(matches)
    if(matches == null || matches.length === 0)
        return url
    
    matches.splice(0, 3)
    const user = matches.shift()
    const repo = matches.shift()
    const method = matches.shift()
    console.log(user,repo, method)
    if(method === 'blob')
        return fixBlob(matches, user??'', repo??'')
    if(method === 'releases')
        url = await fixRelease(matches, user??'', repo??'')
    console.log(url)
    return url
}