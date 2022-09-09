const fs = require('fs');
const path = require('path');

const converter = require('json-2-csv');

const express = require('express');
var iconv = require('iconv-lite');

const app = express()
const port = parseInt(process.env.PORT) || 3000

app.get('/api/:id', (req, res) => {
  const fileName = req.params.id
  const readFile = async (fileName) => {
    const urlParts = fileName.split('.')
    const fileExt = urlParts[1]

    if (fileName === 'upload') {
    }
    else {
      fs.readFile(fileName, 'utf8', async(err, data) => {
        if (err) throw err

        if (fileExt === 'csv') {
          data = await converter.csv2jsonAsync(data, {keys: ['Note']})
        }

        // Get rid of weird symbols in output
        const buf = iconv.encode(data, 'win1252')
        const decoded = iconv.decode(buf, 'utf8')

        res.send(decoded)
      })
    }
  }
  readFile(fileName)
})

app.use(express.static('public'))

app.listen(port, () => {
  const timestamp = new Date().toLocaleTimeString();
	console.log(`> [${timestamp}] App listening on port ${port}...`);
})
