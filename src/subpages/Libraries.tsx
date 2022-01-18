import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useHistory } from "react-router";
import { AppHeader } from "../App";
import { palette } from "../Palette";


function LibraryPane(props: any) {
    const history = useHistory()
    return (
        <div className="w-320 h-360 flex flex-col items-center p-2" style={{backgroundColor: palette.darkBackground}}>
            <label className="text-center text-2xl" style={{fontFamily:'Disket-Bold'}}>{props.name}</label>
            <hr className="bg-white w-full"/>
            <p className="flex-grow text-center">{props.description}</p>
            <div className="flex flex-wrap gap-2 place-content-center">
                <button className="w-32 h-8 text-xl" onClick={()=>history.push('/download?pack=smithed:' + props.slug)}>Download</button>
                <button className="w-32 h-8 text-xl" onClick={()=>history.push('/packs/smithed/' + props.slug)}>View</button>
                <button className="w-32 h-8 text-xl" onClick={()=>window.open(props.source)}>Source</button>
                <button className="w-32 h-8 text-xl" onClick={()=>window.open(props.docs)}>Docs</button>
            </div>
        </div>
    )
}

function Libraries() {
  useEffect(() => {
  }, []);

  return (
    <div>
        <Helmet>
            <meta name="description" content="hi"/>
            <link rel="canonical" href="somelink" />
        </Helmet>
        <AppHeader hideSubtitle={true}/>
        <div className="w-full h-full p-4 flex flex-wrap place-content-center gap-4 flex-wrap">
            <LibraryPane name="Smithed Core" slug="core@0.0.1" source="https://github.com/Smithed-MC/Core" docs="https://wiki.smithed.dev/libraries/smithed-core" description="This library serves as the base for all other libraries but also provides useful functions itself. 'Core' contains tools for custom durability, damage based on a score, custom block placement, and more!"/>
            <LibraryPane name="Smithed Crafter" slug="crafter@0.0.1" source="https://github.com/Smithed-MC/Crafter" docs="https://wiki.smithed.dev/libraries/smithed-crafter" description="'Crafter' makes NBT crafting easy as ever! It supports tags, shaped and shapeless, custom nbt, shift-clicking, and nbt-transferring (think smithing table). 'Crafter' also has an addon that adds all vanilla recipes to it."/>

        </div>
    </div>
  );
}

export default Libraries;