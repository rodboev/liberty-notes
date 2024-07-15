const fs = require('fs')
const path = require('path')
const converter = require('json-2-csv')
const express = require('express')
const fileUpload = require('express-fileupload')
const hash = require('object-hash')

const app = express()
const port = parseInt(process.env.PORT) || 3000

app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
}))

app.post('/api/upload', function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  req.files.file.mv('notes.csv', function(err) { // place file on server
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});

app.get('/api/notes.json', (req, res) => {
  fs.readFile('notes.csv', 'utf8', async(err, data) => {
    if (err) throw err

    data = data.replaceAll("\r", "");
    data = await converter.csv2jsonAsync(data, {keys: ['Note Date', 'Note Time', 'Company', 'Location Code', 'Location ID', 'Note Code', 'Note', 'Added By']})
		data = data.map(note => ({
			...note,
			fingerprint: hash(note),
		}))
    data = JSON.stringify(data, null, 2)

    res.send(data)
  })
})

app.use(express.static('public'))

app.listen(port, () => {
  const timestamp = new Date().toLocaleTimeString();
	console.log(`> [${timestamp}] App listening on port ${port}...`);
})
