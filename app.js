const fs = require('fs')
const path = require('path')

const express = require('express')
const encoding = require('encoding')

const app = express()
const port = parseInt(process.env.PORT) || 3000

app.get('/notes.json', (req, res) => {
  fs.readFile(path.join('public', 'notes.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    res.send(encoding.convert(data, 'windows-1252', 'utf-8'))
  })
})

app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
