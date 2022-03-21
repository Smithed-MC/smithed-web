import { app } from './main.js';
import { Response, Request } from "express-serve-static-core"
import { ParsedQs } from 'qs'
import * as fs from "fs";
import path from "path";
import initialize from './util/database.js';
import { get, ref } from 'firebase/database';



const defaultMeta = async (req: Request) => {
    return {
        title: "Smithed",
        description: "Smithed is the all-in-one datapack experience!",
        image: "https://github.com/TheNuclearNexus/smithed-web/blob/master/public/logo512.png?raw=true"
    }
}

const librariesMeta = async (req: Request) => {
    return {
        title: "Smithed",
        description: "List of all Smithed Libraries",
        image: ""
    }
}

const discordMeta = async (req: Request) => {
    return {
        title: "Smithed",
        description: "Join our discord!",
        image: ""
    }
}

const downloadMeta = async (req: Request) => {
    return {
        title: "Smithed",
        description: "Download datapack(s)",
        image: ""
    }
}

const toolsMeta = async (req: Request): Promise<{ [key: string]: string | undefined }> => {
    const tool = req.params.tool
    if (tool === undefined) return {
        title: "Tools",
        description: "Collection of tools for working with Smithed libraries"
    }
    else if (tool === 'shaped-recipe') return {
        title: "Shaped Recipe Generator",
        description: "For use with Smithed Crafter",
        image: ""
    }
    else if (tool === 'shapeless-recipe') return {
        title: "Shapeless Recipe Generator",
        description: "For use with Smithed Crafter",
        image: ""
    }
    return defaultMeta(req)
}


const packsMeta = async (req: Request) => {
    const { owner, id } = req.params
    
    const database = await initialize()
    if(database === undefined) return defaultMeta(req)

    const packEntry = await get(ref(database, `packs/${owner}:${id}`))

    if (!packEntry.exists()) return { title: `${owner}:${id}`, description: "Unknown pack!", image: "" }

    const uid = packEntry.val()["owner"]
    const userPacks = await get(ref(database, `users/${uid}/packs`))

    if (!userPacks.exists()) return { title: `${owner}:${id}`, description: "Unknown pack!", image: "" }

    for (let p of userPacks.val()) {
        if (p.id === id) {
            return {
                ogSiteName: 'Smithed',
                title: p.display.name,
                description: p.display.description,
                image: p.display.icon
            }
        }
    }

    return { title: `${owner}:${id}`, description: "Unknown pack!", image: "" }
}

interface Pages {
    [key: string]: (req: any) => Promise<{ [key: string]: string | undefined }>
}

export const pages: Pages = {
    "/": defaultMeta,
    "/libraries": librariesMeta,
    "/download": defaultMeta,
    "/discord": discordMeta,
    "/tools": toolsMeta,
    "/tools/:tool": toolsMeta,
    "/packs/:owner/:id([^.]+)": packsMeta,
}

export function register() {
    const filePath = path.resolve(process.cwd(), "../website/build", "index.html");
    let data = fs.readFileSync(filePath, "utf8")
    for (let path in pages) {
        app.get(path, (req: Request, res) => {
            const updateMeta = (meta: { [key: string]: string | undefined }) => {
                let index = data
                for (let m in meta) {
                    const regex = new RegExp(`__${m.toUpperCase()}__`, 'g')

                    let content = meta[m]
                    if (content !== undefined)
                        index = index.replace(regex, content)
                }
                if (!meta['ogSiteName'] !== undefined)
                    index = index.replace(new RegExp('__OGSITENAME__', 'g'), '')
                res.send(index)
            }

            try {
                pages[path](req).then(updateMeta)
            } catch {
                pages["/"](req).then(updateMeta)
            }
        })
    }
}