const fs = require('fs')
const path = require('path')

const converter = require('json-2-csv')

const express = require('express')
const fileUpload = require ('express-fileupload')
// const iconv = require('iconv-lite')

const app = express()
const port = parseInt(process.env.PORT) || 3000

app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
}))

app.post('/api/upload', function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // Use the mv() method to place the file somewhere on your server
  req.files.file.mv('notes.csv', function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});

app.get('/api/notes.json', (req, res) => {
  fs.readFile('notes.csv', 'utf8', async(err, data) => {
    if (err) throw err

    // Get rid of weird symbols in output
    /* No longer needed with new Report Writer configs?
    const buf = iconv.encode(data, 'win1252')
    data = iconv.decode(buf, 'utf8')
    data = data.replaceAll("\\r", "");
    data = data.replaceAll("\\n", "<br />");
    */
    data = data.replaceAll("\r", "");

    data = await converter.csv2jsonAsync(data, {keys: ['Company', 'Location Code', 'Note', 'Added By']})
    data = JSON.stringify(data, null, 2)

    console.log(data)
    res.send(data)
  })
})

app.use(express.static('public'))

app.listen(port, () => {
  const timestamp = new Date().toLocaleTimeString();
	console.log(`> [${timestamp}] App listening on port ${port}...`);
})
