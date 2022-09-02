import fs from 'fs'
import path from 'path'

import express from 'express'
import iconv from 'iconv-lite';

const {encode, decode} = iconv;
import {read, readSync, write, writeSync} from 'to-vfile'
import {reporter} from 'vfile-reporter'
import {reporterJson} from 'vfile-reporter-json'
import {retext} from 'retext'
import retextEnglish from 'retext-english'
import dictionary from 'dictionary-en'
import retextSpell from 'retext-spell'
import retextRepeatedWords from 'retext-repeated-words'
import retextDiacritics from 'retext-diacritics'
import retextIndefiniteArticle from 'retext-indefinite-article'
import retextContractions from 'retext-contractions'
import retextStringify from 'retext-stringify'
import retextProfanities from 'retext-profanities'
import retextEquality from 'retext-equality'

const app = express()
const port = parseInt(process.env.PORT) || 3000

app.get('/notes.json', (req, res) => {
  fs.readFile(path.join('public', 'notes.json'), 'utf8', async(err, data) => {
    if (err) {
      console.error(err)
      return
    }

    const encoded = iconv.encode(data, 'win1252')
    const decoded = iconv.decode(encoded, 'utf8')
    // const recoded = await read('recoded.json', 'utf8', () => console.log(decoded.toString('utf8')))

    const file = await retext()
      .use(retextEnglish)
      .use(retextSpell, dictionary)
      .use(retextRepeatedWords)
      .use(retextDiacritics)
      .use(retextIndefiniteArticle)
      .use(retextContractions)
      .use(retextStringify)
      // .use(retextProfanities)
      .use(retextEquality)
      .process(decoded)

      console.error(reporter(file))
      // writeSync('output.json')

      res.send(String(file))
  })
})

app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
