import { cert, applicationDefault, initializeApp,  } from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth'
import {getDatabase, Database} from 'firebase-admin/database'
import * as fs from 'fs'

export const serviceAccount = JSON.parse(fs.readFileSync(process.env.ADMIN_KEY ?? 'secret.json', {encoding: 'utf-8'}))
const firebaseConfig = {
    credential: cert(serviceAccount),
    databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
    apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
    authDomain: "mc-smithed.firebaseapp.com",
    projectId: "mc-smithed",
    storageBucket: "mc-smithed.appspot.com",
    messagingSenderId: "574184244682",
    appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
    measurementId: "G-40SRKC35Z0"
};

let db: Database|undefined = undefined
export default async function initialize() {
    if(db !== undefined) return db
    initializeApp(firebaseConfig)

    getAuth()
    db = getDatabase()
    return db;
} 
