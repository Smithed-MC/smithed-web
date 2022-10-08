import validatePack  from "./pack.js"
import validateVersion from "./version.js"


let pack: any = {}
console.log(`Empty Data:\n${validatePack(pack)}\n------`)
pack = {id: '', display:{name: '', description: ''}, versions: []}
console.log(`All data defined but invalid:\n${validatePack(pack)}\n------`)
pack.id = 'foobar'
console.log(`Id valid:\n${validatePack(pack)}\n------`)
pack.display.name = 'Foo Bar'
console.log(`Name valid:\n${validatePack(pack)}\n------`)
pack.display.description = 'Faz Baz'
console.log(`Decsription valid:\n${validatePack(pack)}\n------`)

let version = {name: '', downloads: {} as any, supports: [] as string[]}
pack.versions = [version]
console.log(`Versions defined but invalid:\n${validatePack(pack)}\n------`)
console.log(`Version defined but invalid:\n${validateVersion(version)}\n------`)
version.name = 'hi'
console.log(`Version name defined but invalid:\n${validateVersion(version)}\n------`)
version.name = '0.0.1'
console.log(`Version name valid:\n${validateVersion(version)}\n------`)
version.supports = ['1.19']
console.log(`Version supports valid:\n${validateVersion(version)}\n------`)
version.downloads = {}
console.log(`Downloads defined but invalid:\n${validateVersion(version)}\n------`)
version.downloads = {datapack: 'foo', resourcepack: 'bar'}
console.log(`Downloads defined but invalid url:\n${validateVersion(version)}\n------`)
version.downloads = {datapack: 'https://google.com', resourcepack: 'https://api.google.com'}
console.log(`Downloads defined but valid urls:\n${validateVersion(version)}\n------`)

