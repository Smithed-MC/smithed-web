import {initializeApp} from 'firebase/app'
import {getAuth, initializeAuth, signInWithEmailAndPassword} from 'firebase/auth'
import { Database, getDatabase } from 'firebase/database';
const firebaseConfig = {
    apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
    authDomain: "mc-smithed.firebaseapp.com",
    databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
    projectId: "mc-smithed",
    storageBucket: "mc-smithed.appspot.com",
    messagingSenderId: "574184244682",
    appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
    measurementId: "G-40SRKC35Z0"
};

let db: Database|undefined = undefined
export default async function initialize() {
    if(db !== undefined) return db
    const app = initializeApp(firebaseConfig)
    const auth = initializeAuth(app)
    if(process.env.EMAIL === undefined || process.env.PASSWORD === undefined) return undefined;
    await signInWithEmailAndPassword(auth, process.env.EMAIL, process.env.PASSWORD)
    
    db = getDatabase(app)
    return db;
} 
