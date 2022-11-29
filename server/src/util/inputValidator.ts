import { getAuth } from "firebase-admin/auth"

type InputType = 'string'|'number'|'object'


interface InputOptions {
    type: InputType,
    name: string,
    required: boolean
}



export function validateInputs(inputs: [InputOptions, any][]) {
    const issues = []
    for(let i of inputs) {
        const {type, name, required} = i[0]   
        if(i[1] === undefined || i[1] === '') {
            if(required === true)
                issues.push(`Required field '${name}' was undefined!`)
            continue
        }   
        if(typeof i[1] !== type) 
            issues.push(`Field '${name}' was expected to be '${type}', received '${typeof i[1]}'`)
        else if(type === 'string' && i[1].includes('/'))
            issues.push(`Field '${name}' cannot contain the '/' character`)
    }
    return issues
}