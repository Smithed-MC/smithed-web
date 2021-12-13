import EventEmitter from "events";
import React, { useEffect, useRef, useState } from "react";
import { palette } from "../../Palette";

export function validateId(value: string) {
    
    if(!value.match(/([A-Za-z_]+):([A-Za-z_]+)/) && value !== '') {
        if(value.startsWith('#'))
            value = value.charAt(0) + 'minecraft:' + value.substring(1)
        else
            value = 'minecraft:' + value
    }
    else if(value === '')
        value = 'minecraft:air'

    return value
}

const items: {id: string, tag: string}[][] = [
    [
        {id: '', tag:''},
        {id: '', tag:''},
        {id: '', tag:''}
    ],
    [
        {id: '', tag:''},
        {id: '', tag:''},
        {id: '', tag:''}
    ],
    [
        {id: '', tag:''},
        {id: '', tag:''},
        {id: '', tag:''}
    ]
]
let outputCommand = "loot replace block ~ ~ ~ container.16 loot"

const recipeEvents: EventEmitter = new EventEmitter()

function updateOutputCommand(value: string) {
    outputCommand = value
    recipeEvents.emit('update')   
}

function updateItemId(row: number, col: number, value: string) {
    value = validateId(value);

    items[row][col]["id"] = value
    recipeEvents.emit('update')
}

function updateItemNbt(row: number, col: number, value: string) {
    items[row][col]["tag"] = value
    console.log(items)
    recipeEvents.emit('update')
}

function RecipeItem(props: any) {
    return (
        <div className="rounded p-2 flex flex-col gap-2" style={{backgroundColor:palette.darkBackground,border:`1px solid gray`}}>
            <label>Item #{(props.rowNumber * 3) + props.colNumber + 1}</label>
            <input className="w-64 rounded p-1" style={{color:'black'}} placeholder={"ID/Tag"} onChange={(e)=>{updateItemId(props.rowNumber, props.colNumber, e.target.value)}}/>
            <textarea className="w-64 resize rounded p-1" style={{color:'black'}} placeholder={"NBT ex: {blah:1b}"} onChange={(e)=>{updateItemNbt(props.rowNumber, props.colNumber, e.target.value)}}/>
        </div>
    )
}

function RecipeRow(props: any) {
    return (
        <div>
            <div className="flex gap-4 place-content-center">
                <RecipeItem rowNumber={props.rowNumber} colNumber={0}/>
                <RecipeItem rowNumber={props.rowNumber} colNumber={1}/>
                <RecipeItem rowNumber={props.rowNumber} colNumber={2}/>
            </div>
        </div>
    )
}

function buildCondition(index: number): string {
    let bits: string[] = []

    for(let i = 0; i < items[index].length; i++) {
        const item = items[index][i]
        let temp = `{Slot:${i}b`

        if(item.id !== '') {
            if(item.id.startsWith('#'))
                temp += `,item_tag:["${item.id}"]`
            else
                temp += `,id:"${item.id}"`

        }
        else if(item.tag === '')
            temp += `,id:"minecraft:air"`

        if(item.tag !== '' && item.tag !== undefined)
            temp += `,tag:${item.tag}`

        bits.push(temp + "}")
    }

    return `${index}:[${bits.join(',')}]`
}

function ShapedRecipe() {
    const [command, setCommand] = useState('');
    const [outputType, setOutputType] = useState('loot')
    const divHeading = useRef(null)
    const onChange = () => {
        console.log('ran')
        const matchPredicate = (i: {id: string, tag?: string}, idx: number, list: any) => {return i.id === 'minecraft:air' || (i.id === '' && i.tag === '')}

        let result = "execute store result score @s smd.data if entity @s[scores={smd.data=0}] "

        let ingredientConds: string[] = []
        let emptyConds: string[] = []

        for(let i = 0; i < items.length; i++) {
            if(!items[i].every(matchPredicate)) {
                ingredientConds.push(buildCondition(i))
            } else {
                emptyConds.push(`${i}:[]`)
            }
        }

        if(ingredientConds.length > 0) {
            result += `if data storage smd:crafter root.temp{crafting_input:{${ingredientConds.join()}}} `
        }
        if(emptyConds.length > 0) {
            result += `if data storage smd:crafter root.temp{crafting_input:{${emptyConds.join()}}} `
        }

        result += `run ${outputCommand}`

        setCommand(result)
    }

    useEffect(() => {
        recipeEvents.addListener('update', onChange)

        onChange()
        return () => {
            recipeEvents.removeListener('update', onChange)
        }
    }, [])
    return (
        <div className="flex flex-row p-2">
            <div className="flex flex-col gap-4 items-center" style={{flex:'75%'}}>
                <RecipeRow rowNumber={0}/>
                <RecipeRow rowNumber={1}/>
                <RecipeRow rowNumber={2}/>
                <div className="flex flex-col items-center w-full">
                    <div>
                        <label>Output type: </label>
                        <select name="output-type" className="rounded" style={{color:'black'}} defaultValue={outputType} onChange={e => {
                            const type = e.target.value
                            if(type === 'loot')
                                updateOutputCommand('loot replace block ~ ~ ~ container.16 loot')
                            if(type === 'item')
                                updateOutputCommand('item replace block ~ ~ ~ container.16 with')
                            if(type === 'custom')
                                updateOutputCommand('')

                            setOutputType(type)
                        }}>
                            <option value="loot">/loot</option>
                            <option value="item">/item</option>
                            <option value="custom">Custom Command</option>
                        </select>
                    </div>
                    {outputType === 'loot' && <div>
                        <textarea style={{color:'black'}} className="w-full resize p-1 rounded" placeholder="Path to loot" onChange={(e) => {
                            updateOutputCommand(`loot replace block ~ ~ ~ container.16 loot ${e.target.value}`)}}
                        />
                    </div>}
                    {outputType === 'item' && <div>
                        <textarea style={{color:'black'}} className="w-full resize p-1 rounded" placeholder="Item to replace with" onChange={(e) => {
                            updateOutputCommand(`item replace block ~ ~ ~ container.16 with ${e.target.value}`)}}
                        />
                    </div>}
                    {outputType === 'custom' && <div>
                        <textarea style={{color:'black'}} className="w-full resize p-1 rounded" placeholder="Command to run" onChange={(e) => {
                            updateOutputCommand(`${e.target.value}`)}}
                        />
                    </div>}
                </div>
            </div>
            <div className="bg-white rounded w-1/2 p-2 h-full hover:bg-gray-100" onClick={()=>{
                navigator.clipboard.writeText(command);
                alert('Copied the command to your clipboard!')
            }} onMouseEnter={()=>{
                const element = divHeading.current as HTMLHeadingElement|null
                if(element != null) {
                    element.textContent = "Click to copy"
                }
            }} onMouseLeave={()=>{
                const element = divHeading.current as HTMLHeadingElement|null
                if(element != null) {
                    element.textContent = "Output"
                }
            }}>
                <h3 style={{ color: 'black' }} ref={divHeading}>Output</h3>
                <p style={{ color: '#404040' }}>
                    {command}
                </p>
            </div>
        </div>
    );
}

export default ShapedRecipe;