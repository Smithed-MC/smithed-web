import React, { useEffect } from "react";

export const discordUrl = 'https://discord.gg/gkp6UqEUph'

function Discord() {

  useEffect(() => {
    window.location.href = discordUrl;
  }, []);

  return (
    <div>
    </div>
  );
}

export default Discord;