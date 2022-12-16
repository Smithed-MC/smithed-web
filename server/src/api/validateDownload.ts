import { BlobReader, ZipReader } from "@zip.js/zip.js";
import { Request, Response } from "express-serve-static-core";
import fetch from "node-fetch";
export default async function validateDownload(req: Request, res: Response) {
    const { url } = req.query
    if (url === undefined || url === '')
        return res.status(400).send('No url was specified')

    try {
        const resp = await fetch(url as string)
        if (!resp.ok)
            return res.status(200).send(false)

        const zip = await resp.blob()

        const entries = await new ZipReader(new BlobReader(zip)).getEntries()

        res.status(200).send(true)
    } catch {
        res.status(200).send(false)
    }
}