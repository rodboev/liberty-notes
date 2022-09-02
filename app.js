const fs = require('fs')
const path = require('path')

const express = require('express')
const iconv = require('iconv-lite')

const app = express()
const port = parseInt(process.env.PORT) || 3000

app.get('/notes.json', (req, res) => {
  fs.readFile(path.join('public', 'notes.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }

    buf = iconv.encode(data, 'win1252')
    res.send(iconv.decode(buf, 'utf8'))
  })
})

app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
