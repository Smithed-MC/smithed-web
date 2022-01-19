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

const packsMeta = async (req) => {
    const {owner, id} = req.params

    const packEntry = await database.ref(`packs/${owner}:${id}`).get()
    
    if(!packEntry.exists()) return {title: `${owner}:${id}`, description: "Unknown pack!", image: ""}
    
    const uid = packEntry.val()["owner"]
    const userPacks = await database.ref(`users/${uid}/packs`).get()
    
    if(!userPacks.exists()) return {title: `${owner}:${id}`, description: "Unknown pack!", image: ""}

    for(let p of userPacks.val()) {
        if(p.id === id) {
            return {
                title: p.display.name,
                description: p.display.description,
                image: p.display.image
            }
        }
    }

    return {title: `${owner}:${id}`, description: "Unknown pack!", image: ""}
}

const pages = {
    "/?": defaultMeta,
    "/packs/:owner/:id": packsMeta
}

module.exports = {pages}