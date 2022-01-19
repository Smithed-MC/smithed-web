const express = require("express");
const path = require("path");
const fs = require("fs");
const { pages } = require("./data")

const PORT = process.env.PORT || 25565;

const app = express();

const filePath = path.resolve(__dirname, "../build", "index.html");
fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
        return console.log(err);
    }

    for (let path in pages) {
        app.get(path, (req, res) => {
            pages[path](req).then(meta => {
                let index = data
                for (let m in meta) {
                    const regex = new RegExp(`__${m.toUpperCase()}__`, 'g')

                    index = index.replace(regex, meta[m])
                }
                res.send(index)
            })
        })
    }


    app.use(express.static(path.resolve(__dirname, "../build")))

    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`)
    })
})



