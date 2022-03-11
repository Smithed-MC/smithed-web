import EventEmitter from "events";
import React, { useEffect, useRef, useState } from "react";
import { validateId } from "./ShapedRecipe";

let items: {id: string, tag: string, count: number}[] = [
   {id:'',tag:'',count:1}
]
let outputCommand = "loot replace block ~ ~ ~ container.16 loot"

const recipeEvents: EventEmitter = new EventEmitter()

function updateOutputCommand(value: string) {
    outputCommand = value
    recipeEvents.emit('update')   
}

function updateItemId(idx: number, value: string) {
    value = validateId(value);
    items[idx]["id"] = value
    
    recipeEvents.emit('update')
}

function updateItemNbt(idx: number, value: string) {
    items[idx]["tag"] = value
    
    recipeEvents.emit('update')
}
function updateItemCount(idx: number, value: number) {
    items[idx]["count"] = value
    
    recipeEvents.emit('update')
}

function RecipeItem(props: any) {
    const [id, setId] = useState('')
    const [tag, setTag] = useState('')
    const [count, setCount] = useState(0)

    useEffect(() => {
        setId(props.item.id)
        setTag(props.item.tag)
        setCount(props.item.count)
    }, [setId, setTag, setCount, props.item.id, props.item.tag, props.item.count])

    return (
        <div className="rounded p-2 flex flex-col gap-2 bg-darkBackground" style={{border:`1px solid gray`}}>
            <div className="flex flex-row place-content-between w-full">
                <label>Item #{props.index + 1}</label>
                {/* <label className="hover:opacity-50" onClick={()=>{
                    if(items.length === 1) return;
                
                    items.splice(props.index, 1)

                    recipeEvents.emit('update')
                }}>❌</label> */}
            </div>  
            <input className="w-64 rounded p-1" style={{color:'black'}} placeholder={"ID/Tag"} defaultValue={id} 
                onChange={(e)=>{updateItemId(props.index, e.target.value)}}/>
            <input className="w-64 rounded p-1" style={{color:'black'}} placeholder={"Count (default: 0)"} defaultValue={count !== 0 ? count : ''}
                onChange={(e)=>{updateItemCount(props.index, Number.parseInt(e.target.value))}}/>
            <textarea className="w-64 resize rounded p-1" style={{color:'black'}} placeholder={"NBT ex: {blah:1b}"} defaultValue={tag}
                onChange={(e)=>{updateItemNbt(props.index, e.target.value)}}/>
        </div>
    )
}

function buildCondition(index: number): string {

    const item = items[index]
    let temp = `{Count:${item.count}b`

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

    temp += "}"
    

    return temp
}

function ShapelessRecipe() {
    const [command, setCommand] = useState('');
    const [outputType, setOutputType] = useState('loot')
    const [itemDisplays, setItemDisplays] = useState([])
    const divHeading = useRef(null)
    const onChange = () => {
        let result = "execute store result score @s smd.data if entity @s[scores={smd.data=0}] "

        let ingredientConds: string[] = []
        let displays = []

        for(let i = 0; i < items.length; i++) {
            displays.push(<RecipeItem item={items[i]} index={i}/>)
            if(items[i].count > 0 && items[i].id !== 'minecraft:air') {
                ingredientConds.push(buildCondition(i))
            }
        }
        setItemDisplays(displays as never[])

        if(ingredientConds.length > 0) {
            result += `if score count smd.data matches ${ingredientConds.length} if data storage smd:crafter root.temp{shapeless_crafting_input:[${ingredientConds.join()}]} `
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
            <div className="flex flex-row gap-4 justify-center flex-wrap" style={{flex:'75%'}}>
                {itemDisplays}
                <div className="flex flex-col place-content-center">
                    {items.length < 9 && <button onClick={()=>{
                        items.push({id:'',tag:'',count:0})
                        onChange()
                    }} className="w-32 h-32">Add Item</button>}
                </div>
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

export default ShapelessRecipe;