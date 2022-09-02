import fs from 'fs'
import path from 'path'

import express from 'express'
import iconv from 'iconv-lite';
const {encode, decode} = iconv;

import {unified} from 'unified'
import {readSync} from 'to-vfile'
import {reporter} from 'vfile-reporter'
import {VFileMessage} from 'vfile-message'

import {retext} from 'retext'
import retextEnglish from 'retext-english'
import retextSpell from 'retext-spell'
import retextRepeatedWords from 'retext-repeated-words'
import retextDiacritics from 'retext-diacritics'
import retextIndefiniteArticle from 'retext-indefinite-article'
import retextContractions from 'retext-contractions'
import retextSentenceSpacing from 'retext-sentence-spacing'
import retextStringify from 'retext-stringify'
import dictionary from 'dictionary-en'

const request = fs.readFile(path.join('public', 'notes.json'), 'utf8', async (err, data) => {
  if (err) throw err;
  let notes = JSON.parse(data)
  readSync(path.join('public', 'notes.json'))

  // Fix character encoding strange symbols
  notes = iconv.encode(notes, 'win1252')
  notes = iconv.decode(notes, 'utf8')
  
  notes = await retext()
    .use(retextEnglish)
    .use(retextRepeatedWords)
    .use(retextDiacritics)
    .use(retextIndefiniteArticle)
    .use(retextContractions)
    .use(retextStringify)
    // .use(retextSpell, dictionary)
    .process(notes)
    .then((notes) => {
      function ReplaceAt(input, search, replace, start, end) {
        return input.slice(0, start)
            + input.slice(start, end).replace(search, replace)
            + input.slice(end);
      }    
      
      let fixed = [];
      for (const i = 0; i < notes.length; i++) {
        if (notes.messages.length > 0) {
          for (msg of notes.messages) {
            fixed.push(msg.value.ReplaceAt(
              msg.value, msg.actual, msg.expected[0], msg.column,
              msg.column + msg.actual.length-1)
            )
          }
        }
        else {
          fixed.push(notes[i]);
        }
      }

      console.log(fixed);
      
      // fs.writeFileSync(path.join('public', 'output.json'), notes)
      // reporter(notes)
      // fs.writeFileSync('output.json', notes)
    })
  
  // notes = JSON.stringify(notes, null, 2);
  // console.log(notes)
  }
)

/*
  .process(await read(notes), function(err, cleaned) {
    console.log(String(cleaned))
    console.log(cleaned.length);
    console.error(reporter(err || cleaned))
  })
*/
/*
console.log(cleaned.messages.expected)

const app = express()
const port = parseInt(process.env.PORT) || 3000

app.get('/notes.json', async (req, res) => {
  res.send(read()
})

app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})*/