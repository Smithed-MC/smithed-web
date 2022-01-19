const express = require("express");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 25565;

const app = express();

const filePath = path.resolve(__dirname, "./build", "index.html");
fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
        return console.log(err);
    }
    const index = data
        .replace(/__TITLE__/g, "Smithed")
        .replace(/__DESCRIPTION__/g, "Smithed is the a datapack experience!");

    const handler = (req, res) => {
        res.send(index)
    }

    
    app.get('/', handler);
    app.get("/libraries", handler);
    app.use(express.static(path.resolve(__dirname, "./build")))

    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`)
    })
})



