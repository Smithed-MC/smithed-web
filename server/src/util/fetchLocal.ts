import { BACK_PORT } from "../main.js";
import fetch from "node-fetch";
export async function fetchLocal(uri: string) {
    return await fetch(`http://localhost:${BACK_PORT}/${uri}`)
}