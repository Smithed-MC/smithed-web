export function setDescription(content: string) {
    const desc = document.getElementById("metaDesc") as HTMLMetaElement

    desc.content = content
}