import { initializeApp } from 'firebase/app'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import chalk from 'chalk'
import generateTests from './tests.js'
initializeApp({
    databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
    apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
    authDomain: "mc-smithed.firebaseapp.com",
    projectId: "mc-smithed",
    storageBucket: "mc-smithed.appspot.com",
    messagingSenderId: "574184244682",
    appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
    measurementId: "G-40SRKC35Z0"
})

async function request(name: string, uri: string, expectedStatus: number, body?: any) {
    const url = `http://localhost:9000${uri}`
    console.log('------\n' + chalk.green(`TESTING`), chalk.blue(`"${name}"`))

    const mode = body === undefined ? 'GET' : 'PUT'
    console.log(chalk.yellow(mode), chalk.white(uri.split('?')[0]))

    const response = await fetch(url, { method: mode, headers: { "Content-Type": "application/json" }, body: body !== undefined ? JSON.stringify({ body }) : undefined })

    const text = await response.text();
    console.log(chalk.blue(`[${response.status}] ${chalk.white(text.length < 300 ? text : text.substring(0, 300) + '...')}\n\n`))

    if (response.status === expectedStatus) {
        console.log(chalk.green(`PASSED`))
        return true
    }
    console.log(chalk.red(`FAILED`))
    return false
}



async function test() {
    const tests = await generateTests()

    // await request('/packs')

    let passed = 0;
    for (const test of tests)
        passed += await request(test.title, test.uri, test.expectedStatus ?? 200, test.body) ? 1 : 0

    console.log(`Results ${passed}/${tests.length}`)
}

dotenv.config()
test()