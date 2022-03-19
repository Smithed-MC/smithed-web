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
        if (path.startsWith('r')) {
            var regPath = new RegExp(path.substring(1), 'g')
            console.log(regPath)
        }

        app.get(regPath !== undefined ? regPath : path, (req, res) => {
            const updateMeta = meta => {
                let index = data
                for (let m in meta) {
                    console.log(m)
                    const regex = new RegExp(`__${m.toUpperCase()}__`, 'g')

                    index = index.replace(regex, meta[m])
                }
                if(!meta.includes('ogSiteName'))
                    index = index.replace('__OGSITENAME__', '')
                res.send(index)
            }

            try {
                pages[path](req).then(updateMeta)
            } catch {
                pages["/"](req).then(updateMeta)
            }
        })
    }

    app.use(express.static(path.resolve(__dirname, "../build")))

    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`)
    })
})



