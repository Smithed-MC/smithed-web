import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import fetch from "node-fetch";
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

async function generateTests() {
    const cred = await signInWithEmailAndPassword(getAuth(), process.env.EMAIL ?? '', process.env.PASSWORD ?? '')
    const token = await cred.user.getIdToken();
    const uid = cred.user.uid;

    const PAT = await (await fetch(`http://localhost:9000/getToken?token=${token}&expires=1h`)).text()
    // console.log(PAT)

    return [
        {
            title: 'Get all packs',
            uri: `/getPacks`,
            method: 'GET',
            expectedStatus: 200
        },
        {
            title: 'Get all of my packs',
            uri: `/getUserPacks?uid=${uid}`,
            expectedStatus: 200
        },

        {
            title: 'Add a pack, no token',
            uri: `/addUserPack?uid=${uid}`,
            expectedStatus: 400,
            body: validPackData
        },
        {
            title: 'Add a pack, w/ invalid token',
            uri: `/addUserPack?uid=${uid}&token=foo`,
            method: 'POST',
            expectedStatus: 401,
            body: validPackData
        },
        {
            title: 'Add a pack, w/ token',
            uri: `/addUserPack?uid=${uid}&token=${token}`,
            method: 'POST',
            expectedStatus: 200,
            body: validPackData
        },

        {
            title: 'Get my added pack',
            uri: `/getUserPack?uid=${uid}&pack=test`,
            expectedStatus: 200
        },

        {
            title: 'Set data of pack, no token',
            uri: `/setUserPack?uid=${uid}&pack=test`,
            body: validPackData,
            expectedStatus: 400
        },
        {
            title: 'Set data of pack, w/ invalid token',
            uri: `/setUserPack?uid=${uid}&pack=test&token=foo`,
            method: 'PUT',
            body: validPackData,
            expectedStatus: 401
        },
        {
            title: 'Set data of pack, w/ token',
            uri: `/setUserPack?uid=${uid}&pack=test&token=${token}`,
            method: 'PUT',
            body: validPackData,

        },
        {
            title: 'Set data of pack, w/ PAT',
            uri: `/setUserPack?uid=${uid}&pack=test&token=${PAT}`,
            method: 'PUT',
            body: validPackData,

        },


        {
            title: 'Add a version, no token',
            uri: `/addUserPackVersion?uid=${uid}&pack=test`,
            method: 'POST',
            expectedStatus: 400,
            body: validVersionData
        },
        {
            title: 'Add a version, w/ invalid token',
            uri: `/addUserPackVersion?uid=${uid}&pack=test&token=foo`,
            method: 'POST',
            expectedStatus: 401,
            body: validVersionData
        },
        {
            title: 'Add a version, w/ token',
            uri: `/addUserPackVersion?uid=${uid}&pack=test&token=${token}`,
            method: 'POST',
            expectedStatus: 200,
            body: validVersionData
        },

        {
            title: 'Get my added version',
            uri: `/getUserPackVersion?uid=${uid}&pack=test&version=0.0.2`,
            expectedStatus: 200
        },

        {
            title: 'Set data of version, no token',
            uri: `/setUserPackVersion?uid=${uid}&pack=test&version=0.0.2`,
            method: 'PUT',
            body: validVersionData,
            expectedStatus: 400
        },
        {
            title: 'Set data of version, w/ invalid token',
            uri: `/setUserPackVersion?uid=${uid}&pack=test&version=0.0.2&token=foo`,
            method: 'PUT',
            body: validVersionData,
            expectedStatus: 401
        },
        {
            title: 'Set data of version, w/ token',
            uri: `/setUserPackVersion?uid=${uid}&pack=test&version=0.0.2&token=${token}`,
            method: 'PUT',
            body: validVersionData,

        },

        {
            title: 'Delete my added version, no token',
            uri: `/deleteUserPackVersion?uid=${uid}&pack=test&version=0.0.2`,
            method: 'DELETE',
            expectedStatus: 400,
        },
        {
            title: 'Delete my added version, w/ invalid token',
            uri: `/deleteUserPackVersion?uid=${uid}&pack=test&version=0.0.2&token=foo`,
            method: 'DELETE',
            expectedStatus: 401,
        },
        {
            title: 'Delete my added version, w/ token',
            uri: `/deleteUserPackVersion?uid=${uid}&pack=test&version=0.0.2&token=${token}`,
            method: 'DELETE',
            expectedStatus: 200,
        },
        {
            title: 'Delete my added pack, no token',
            uri: `/deleteUserPack?uid=${uid}&pack=test`,
            expectedStatus: 400,
        },
        {
            title: 'Delete my added pack, w/ invalid token',
            uri: `/deleteUserPack?uid=${uid}&pack=test&token=foo`,
            expectedStatus: 401,
        },
        {
            title: 'Delete my added pack, w/ token',
            uri: `/deleteUserPack?uid=${uid}&pack=test&token=${token}`,
            expectedStatus: 200,
        },
        {
            title: 'Generate tokenm, no token',
            uri: `/getToken`,
            expectedStatus: 400
        },
        {
            title: 'Generate token, w/ invalid token',
            uri: `/getToken?token=foo`,
            expectedStatus: 401
        },
        {
            title: 'Generate token, w/ token',
            uri: `/getToken?token=${token}`,
            expectedStatus: 200
        }
    ]
}

export default generateTests