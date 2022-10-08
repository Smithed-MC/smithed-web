import semver from 'semver'
import Schema from "validate";

const validSemver = (val: string) => semver.valid(val) != null
const urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/

type Dependency = {datapack?: string, resourcepack?: string}

export const version = new Schema({
    name: {
        type: String,
        required: true,
        use: {validSemver}
    },
    breaking: {
        type: Boolean
    },
    supports: {
        type: Array<string>,
        required: true,
        length: {min: 1}
    },
    dependenices: [{
        id: {
            type: String,
            required: true,
            length: {min: 3}
        },
        version: {
            type: String,
            required: true,
            use: {validSemver}
        }
    }],
    downloads: {
        datapack: {
            required: true,
            match: urlRegex,
            type: String
        },        
        resourcepack: {
            required: false,
            match: urlRegex,
            type: String
        }
    }
})


export default function validateVersion(data: any) {
    return version.validate(data)
}