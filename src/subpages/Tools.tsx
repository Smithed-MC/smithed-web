import React from "react";
import { Route, Switch, useHistory, useRouteMatch } from "react-router";
import ShapedRecipe from "./tools/ShapedRecipe";
import ShapelessRecipe from "./tools/ShapelessRecipe";

function Tools() {
    const history = useHistory()
    const match = useRouteMatch("/tools/")
    return (
        <div className="w-full h-full">
            {match && <div className="h-8 flex bg-darkAccent">
                <select style={{backgroundColor:'transparent',border:'none'}} name="tool-select" defaultValue={history.location.pathname.replace('/tools/', '')}onChange={(e)=>{
                    history.push('/tools/' + e.target.value)
                }}>
                    <option style={{color:'black'}} value="shaped-recipe">Shaped Recipe</option>
                    <option style={{color:'black'}} value="shapeless-recipe">Shapeless Recipe</option>
                </select>    
            </div>}
            <Switch>
                <Route path="/tools/shaped-recipe" component={ShapedRecipe}/>
                <Route path="/tools/shapeless-recipe" component={ShapelessRecipe}/>
                <Route exact path = "/tools">
                    <div className="flex flex-col items-center gap-4 p-4">
                        <h3>Smithed Crafter Tools</h3>
                        <button className="w-48 h-8" onClick={() => history.push('/tools/shaped-recipe')}>Shaped Recipe</button>
                        <button className="w-48 h-8" onClick={() => history.push('/tools/shapeless-recipe')}>Shapeless Recipe</button>
                    </div>
                </Route>
            </Switch>
        </div>
    );
}

export default Tools;