import React, { useEffect } from "react";
import { Route, Switch } from "react-router";

function ImageRef(props: any) {
  const image = props.image
  useEffect(()=>{
      window.location.href=image
  })

  return (<span/>)
}

function Images() {

  return (
    <Switch>
      <Route path='/images/sponsored'>
        <ImageRef image={'https://github.com/TheNuclearNexus/smithed/blob/master/public/sponsored_project.png?raw=true'}/>
      </Route>
      <Route path='/images/available'>
        <ImageRef image={'https://github.com/TheNuclearNexus/smithed/blob/master/public/now_available.png?raw=true'}/>
      </Route>
      <Route path='/images/library'>
        <ImageRef image={'https://github.com/TheNuclearNexus/smithed/blob/master/public/official_smithed_library.png?raw=true'}/>
      </Route>
    </Switch>
  );
}

export default Images;