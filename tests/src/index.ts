import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import chalk from 'chalk'
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

async function request(name: string, uri: string, expectedStatus: number, mode: string = 'GET', body?: any) {
    const url = `http://localhost:9000${uri}`
    console.log('------\n' + chalk.green(`TESTING`), chalk.blue(`"${name}"`))
    console.log(chalk.yellow(mode), chalk.white(uri.split('?')[0]))

    const response = await fetch(url, { method: mode, headers: { "Content-Type": "application/json" }, body: mode !== 'GET' ? JSON.stringify({ body }) : undefined })

    const text = await response.text();
    console.log(chalk.blue(`[${response.status}] ${chalk.white(text.length < 300 ? text : text.substring(0, 300) + '...')}\n\n`))

    if (response.status === expectedStatus) {
        console.log(chalk.green(`PASSED`))
        return true
    }
    console.log(chalk.red(`FAILED`))
    return false
}


const validPackData = {
    data: {
        id: 'test',
        display: {
            name: 'test',
            description: 'test'
        },
        versions: [
            {
                name: '0.0.1',
                supports: [
                    '1.19'
                ],
                downloads: {
                    datapack: 'https://api.smithed.dev/download?pack=creepermagnet_:tcc'
                },
                dependencies: []
            }
        ]
    }
}
const validVersionData = {
    data: {
        name: '0.0.2',
        supports: [
            '1.19'
        ],
        downloads: {
            datapack: 'https://api.smithed.dev/download?pack=creepermagnet_:tcc'
        },
        dependencies: []
    }
}

async function test() {
    const cred = await signInWithEmailAndPassword(getAuth(), process.env.EMAIL ?? '', process.env.PASSWORD ?? '')
    const token = await cred.user.getIdToken()
    const uid = cred.user.uid;

    // await request('/packs')

    const tests = [
        {
            title: 'Get all packs',
            uri: `/packs`,
            method: 'GET',
            expectedStatus: 200
        },
        {
            title: 'Get all of my packs',
            uri: `/users/${uid}/packs`,
            expectedStatus: 200
        },

        {
            title: 'Add a pack, no token',
            uri: `/users/${uid}/packs`,
            method: 'POST',
            expectedStatus: 400,
            body: validPackData
        },
        {
            title: 'Add a pack, w/ invalid token',
            uri: `/users/${uid}/packs?token=foo`,
            method: 'POST',
            expectedStatus: 401,
            body: validPackData
        },
        {
            title: 'Add a pack, w/ token',
            uri: `/users/${uid}/packs?token=${token}`,
            method: 'POST',
            expectedStatus: 200,
            body: validPackData
        },

        {
            title: 'Get my added pack',
            uri: `/users/${uid}/packs/test`,
            expectedStatus: 200
        },

        {
            title: 'Set data of pack, no token',
            uri: `/users/${uid}/packs/test`,
            method: 'PUT',
            body: validPackData,
            expectedStatus: 400
        },
        {
            title: 'Set data of pack, w/ invalid token',
            uri: `/users/${uid}/packs/test?token=foo`,
            method: 'PUT',
            body: validPackData,
            expectedStatus: 401
        },
        {
            title: 'Set data of pack, w/ token',
            uri: `/users/${uid}/packs/test?token=${token}`,
            method: 'PUT',
            body: validPackData,

        },


        {
            title: 'Add a version, no token',
            uri: `/users/${uid}/packs/test/versions`,
            method: 'POST',
            expectedStatus: 400,
            body: validVersionData
        },
        {
            title: 'Add a version, w/ invalid token',
            uri: `/users/${uid}/packs/test/versions?token=foo`,
            method: 'POST',
            expectedStatus: 401,
            body: validVersionData
        },
        {
            title: 'Add a version, w/ token',
            uri: `/users/${uid}/packs/test/versions?token=${token}`,
            method: 'POST',
            expectedStatus: 200,
            body: validVersionData
        },

        {
            title: 'Get my added version',
            uri: `/users/${uid}/packs/test/versions/0.0.2`,
            expectedStatus: 200
        },

        {
            title: 'Set data of version, no token',
            uri: `/users/${uid}/packs/test/versions/0.0.2`,
            method: 'PUT',
            body: validVersionData,
            expectedStatus: 400
        },
        {
            title: 'Set data of version, w/ invalid token',
            uri: `/users/${uid}/packs/test/versions/0.0.2?token=foo`,
            method: 'PUT',
            body: validVersionData,
            expectedStatus: 401
        },
        {
            title: 'Set data of version, w/ token',
            uri: `/users/${uid}/packs/test/versions/0.0.2?token=${token}`,
            method: 'PUT',
            body: validVersionData,

        },

        {
            title: 'Delete my added version, no token',
            uri: `/users/${uid}/packs/test/versions/0.0.2`,
            method: 'DELETE',
            expectedStatus: 400,
        },
        {
            title: 'Delete my added version, w/ invalid token',
            uri: `/users/${uid}/packs/test/versions/0.0.2?token=foo`,
            method: 'DELETE',
            expectedStatus: 401,
        },
        {
            title: 'Delete my added version, w/ token',
            uri: `/users/${uid}/packs/test/versions/0.0.2?token=${token}`,
            method: 'DELETE',
            expectedStatus: 200,
        },
        {
            title: 'Delete my added pack, no token',
            uri: `/users/${uid}/packs/test`,
            method: 'DELETE',
            expectedStatus: 400,
        },
        {
            title: 'Delete my added pack, w/ invalid token',
            uri: `/users/${uid}/packs/test?token=foo`,
            method: 'DELETE',
            expectedStatus: 401,
        },
        {
            title: 'Delete my added pack, w/ token',
            uri: `/users/${uid}/packs/test?token=${token}`,
            method: 'DELETE',
            expectedStatus: 200,
        },
    ]

    let passed = 0;
    for (const test of tests)
        passed += await request(test.title, test.uri, test.expectedStatus ?? 200, test.method ?? 'GET', test.body) ? 1 : 0

    console.log(`Results ${passed}/${tests.length}`)
}

dotenv.config()
test()