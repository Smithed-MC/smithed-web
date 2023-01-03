import { cleanCache, handle as handleDownload } from "./api/download.js";
import getPack from "./api/getPack.js";
import { getPacks } from "./api/getPacks.js";
import { getUser } from "./api/getUser.js";
import { getSanitizedUsername } from "./api/getSanitizedUsername.js";
import { backendApp } from "./main.js";
import { getUID } from "./api/getUID.js";
import { addUserPack, deleteUserPack, getUserPack, getUserPacks, setUserPack } from "./api/handleUserPacks.js";
import { addUserPackVersion, deleteUserPackVersion, getUserPackVersion, getUserPackVersions, setUserPackVersion } from "./api/userPack/handleVersions.js";
import * as jose from 'jose'
import { serviceAccount } from "./util/database.js";
import getToken from "./api/getToken.js";
import validateDownload from "./api/validateDownload.js";
import { getVersions } from "./api/getVersions.js";

const routes: { [key: string]: any } = {
    getPack: getPack,
    getPacks: getPacks,
    download: handleDownload,
    getUID: getUID,
    getSanitizedUsername: getSanitizedUsername,
    getUser: getUser,
    getUserPack: getUserPack,
    getUserPacks: getUserPacks,
    setUserPack: setUserPack,
    addUserPack: addUserPack,
    deleteUserPack: deleteUserPack,
    getUserPackVersion: getUserPackVersion,
    getUserPackVersions: getUserPackVersions,
    addUserPackVersion: addUserPackVersion,
    setUserPackVersion: setUserPackVersion,
    deleteUserPackVersion: deleteUserPackVersion,
    getToken: getToken,
    validateDownload: validateDownload,
    getVersions: getVersions
}


export async function register() {
    for (let r in routes) {
        // if(!r.startsWith('get'))
        //     backendApp.put('/'+ r, bodyParser.json(), routes[r])
        // else
        backendApp.get('/' + r, routes[r])
        backendApp.put('/' + r, routes[r])
        backendApp.post('/' + r, routes[r])

    }

    // Make sure to wipe the cache every so often to save space on disk
    setInterval(cleanCache, 10 * 1000)

}