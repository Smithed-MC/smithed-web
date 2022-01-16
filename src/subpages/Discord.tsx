import React, { useEffect } from "react";
import { Helmet } from "react-helmet";

export const discordUrl = 'https://discord.gg/gkp6UqEUph'

function Discord() {

  useEffect(() => {
    window.location.href = discordUrl;
  }, []);

  return (
    <div>
      <Helmet>
        <meta
          name="description"
          id="metaDesc"
          content="Join the Smithed Discord!"
        />
      </Helmet>
    </div>
  );
}

export default Discord;