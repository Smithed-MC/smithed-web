import { getAuth } from 'firebase-admin/auth'
import * as jose from 'jose'
import { serviceAccount } from './database.js'

let privateKey: jose.KeyLike
export async function getPrivateKey() {
    if (privateKey === undefined)
        privateKey = await jose.importPKCS8(serviceAccount.private_key, 'RS256')
    return privateKey
}

export async function verifyToken(token: string): Promise<string | undefined> {
    try {
        const decodedToken = await getAuth().verifyIdToken(token)
        return decodedToken.uid
    } catch {
        try {
            const decodedToken = await jose.jwtVerify(token, await getPrivateKey())
            // console.log('Time remaining', (decodedToken.payload.exp??0) - Math.round(Date.now() / 1000))
            if ((Date.now() / 1000) < (decodedToken.payload.exp ?? 0))
                return decodedToken.protectedHeader.uid as string
        } catch (e) { }
    }
    throw new Error('Invalid Token')

}