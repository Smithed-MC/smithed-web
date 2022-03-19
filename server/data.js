const firebase = require('firebase')


const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
    authDomain: "mc-smithed.firebaseapp.com",
    projectId: "mc-smithed",
    storageBucket: "mc-smithed.appspot.com",
    messagingSenderId: "574184244682",
    appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
    measurementId: "G-40SRKC35Z0"
})

const auth = firebaseApp.auth();
const database = firebaseApp.database()


const defaultMeta = async (req) => {
    return {
        title: "Smithed",
        description: "Smithed is the all-in-one datapack experience!",
        image: "https://github.com/TheNuclearNexus/smithed-web/blob/master/public/logo512.png?raw=true"
    }
}

const librariesMeta = async (req) => {
    return {
        title: "Smithed",
        description: "List of all Smithed Libraries",
        image: ""
    }
}

const discordMeta = async (req) => {
    return {
        title: "Smithed",
        description: "Join our discord!",
        image: ""
    }
}

const downloadMeta = async (req) => {
    return {
        title: "Smithed",
        description: "Download datapack(s)",
        image: ""
    }
}

const toolsMeta = async (req) => {
    const tool = req.params.tool
    if(tool === undefined) return {
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

}

const packsMeta = async (req) => {
    const { owner, id } = req.params
    console.log(owner, id)
    const packEntry = await database.ref(`packs/${owner}:${id}`).get()

    if (!packEntry.exists()) return { title: `${owner}:${id}`, description: "Unknown pack!", image: "" }

    const uid = packEntry.val()["owner"]
    const userPacks = await database.ref(`users/${uid}/packs`).get()

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

const pages = {
    "/": defaultMeta,
    "/libraries": librariesMeta,
    "/download": defaultMeta,
    "/discord": discordMeta,
    "/tools": toolsMeta,
    "/tools/:tool": toolsMeta,
    "/packs/:owner/:id": packsMeta,
}

module.exports = { pages }