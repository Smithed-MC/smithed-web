import { getAuth } from "firebase-admin/auth";
import { verifyToken } from "./customToken.js";
import { fetchLocal } from "./fetchLocal.js";

export function sanitizeDisplayName(rawDisplayName: any) {
    return rawDisplayName.toLowerCase().replaceAll(' ', '-').replaceAll(/(\s+|\[|\]|{|}|\||\\|"|%|~|#|<|>|\?)/g, '');
}

export async function uidOrGetFromUsername(uid: string|undefined, username: string|undefined) {
    return uid !== undefined ? uid : await (await fetchLocal(`getUID?username=${username}`)).text() 
}

export async function tokenMatchesUID(uid: string, token: string) {
    try {
        var tokenUID = (await verifyToken(token as string)) ?? '';
    } catch {
        var tokenUID = ''
    }


    if (uid !== tokenUID)
        return false
    return true
} 