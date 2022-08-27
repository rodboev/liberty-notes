let fs = require('fs');

let notes = require('./notes.json');

const express = require('express')
const app = express()
const port = parseInt(process.env.PORT, 10) || 3000;

const categories = [
  {
    name: 'SERVICE',
    priority: 1, // 1 == highest
    keywords: [
      'heavy',
      'sanitation',
      'garbage',
      'breeding ground',
      'tons of',
      'ton of',
      'lots of',
      'lot of',
      'alarm',
      'advise',
      'advice',
      'infestation'
    ],
    notes: []
  },
  {
    name: 'KEY',
    priority: 2,
    keywords: [
      'key',
      'keys',
      'lockbox',
      'lock box',
    ],
    notes: []
  },
  {
    name: 'SALES',
    priority: 3,
    keywords: [
      'entry point',
      'entry points',
      'recommend',
      'recommended',
      'recommendation',
      'need',
      'needs'
    ],
    notes: []
  }
]

const keywords = categories.flatMap(c => c.keywords)
const groups = []

// let numHighlighted = 0;

for (const note of notes) {
  // Highlight keywords in notes
  const pattern = new RegExp(keywords.join('\\b|\\b'), 'gi'); 
  const highlightedNote = note.replace(pattern, match => `<span class='highlight'>${match}</span>`);
  /*
  if (note.indexOf(highlightedNote)) {
    console.log(highlightedNote + `\n`);
    numHighlighted++;
  }
  console.log(`Highlighted ${numHighlighted} of ${notes.length}`);
  */

  // Organize into groups
  for (const category of categories) {
    for (const keyword of category.keywords) {
      const pattern = new RegExp('\\b' + keyword + '\\b', 'gi'); 
      if (pattern.test(highlightedNote)) {
        category.notes.push(highlightedNote)
        break // TODO: Check for keyword priority
      }
    }
  }
}

// console.log(JSON.stringify(categories, null, 2));
// console.dir(categories)
const outputFilename = 'output.json';
fs.writeFile(outputFilename, JSON.stringify(categories, null, 2), function(err) {
  if(err) {
    console.log(err);
  } else {
    // console.log("JSON saved to " + outputFilename);
    app.get('/', (req, res) => {
      let response = `<link rel="stylesheet" href="style.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <p>Categories with highlights (raw JSON to be formatted later):<pre>
${JSON.stringify(categories, null, 4)}
        </pre></p>
        <hr>
        <p>Original notes (first 100 from sheet):<pre>
${JSON.stringify(notes, null, 4)}
        </pre></p>`
      res.send(response)
      /*
      res.send('<link rel="stylesheet" href="style.css" /><pre>');
      res.sendFile(__dirname + '/output.json');
      res.send('</pre>');
      */
    })

    app.get('/style.css', (req, res) => {
      res.sendFile(__dirname + '/style.css');
    })

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })    
  }
}); 

// console.log('This completes before JSON is written.')
