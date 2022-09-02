import fs from 'fs'
import path from 'path'

import express from 'express'
import iconv from 'iconv-lite';
const {encode, decode} = iconv;

const app = express()
const port = parseInt(process.env.PORT) || 3000

app.get('/notes.json', (req, res) => {
  fs.readFile(path.join('__dirname', 'notes.json'), 'utf8', async(err, data) => {
    if (err) throw err
    const buf = iconv.encode(data, 'win1252')
    const decoded = iconv.decode(buf, 'utf8')
    res.send(decoded)
  })
})

app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
