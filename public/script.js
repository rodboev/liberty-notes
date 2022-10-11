'use strict'

const categories = [
  {
    name: 'SERVICE',
    keywords: [
      'heavy',
      'sanitation',
      'garbage',
      'breeding ground',
      'breeding site',
      'alarm',
      'advise',
      'advice',
      'infestation'
    ],
    // regex: /\bheavy\b|\b.+?sanit.+?\b|\bgarbage\b|\bbreeding.+?\b|\balarm\b|\badvi[sc]e\b|\binfest.+?\b/,
    notes: []
  },
  {
    name: 'KEY',
    keywords: [
      'key',
      'keys',
      'gate',
      'lock',
      'lockbox',
      'lock box',
    ],
    // regex: /\bkeys?\b|\bgate\b|\block ?box\b/,
    notes: []
  },
  {
    name: 'SALES',
    keywords: [
      'entry point',
      'entry points',
      'recommend',
      'recommended',
      'recommendation',
      'need',
      'needs'
    ],
    // regex: /\bentry( ?way| point)?s?\b|\brecommend.+?\b|\bneed.+?\b/,
    notes: []
  },
  {
    name: 'UNCATEGORIZED',
    keywords: [],
    notes: []
  }
]

/*
let roots = null
for (const category of categories) {
    console.log(category.name)
    roots += new RegExp(category.regex)
}
const regexes = String(new RegExp(roots))
console.log(roots) // looks more correct
console.log(regexes)
*/

const formatNotes = (notes) => {
  const formattedNotes = []
  const url = "https://app.pestpac.com/location/detail.asp?LocationID"
  for (let note of notes) {
    if (note.hasOwnProperty('Note')) {
      const namesToExclude = ['MIRIAM', 'CAROLINE', 'JAMESGAMM']
      if (!namesToExclude.includes(note['Added By'])) {
        note = `<h5>Name:</h5><a href="${url}=${note['Location ID']}">${note['Company']}</a>
                <a class="code" href="${url}=${note['Location ID']}">[${note['Location Code']}]</a><br />
                <h5>Note:</h5><span class="note">${note['Note']
                   .replace(/^Service: /, "")
                   .replace(/\s{2,}/g, "<br />")}
                 </span><br />
                <h5>From:</h5>${note['Added By']}</span>`
        formattedNotes.push(note)
      }
    }
    else {
      alert("Couldn't find a \"Note\" column")
      break
    }
  }
  return formattedNotes
}

const groupNotes = (notes) => {
  const keywords = categories.flatMap(c => c.keywords)
  
  for (const note of notes) {
    const pattern = new RegExp(keywords.join('\\b|\\b'), 'gi')
    const highlightedNote = note.replace(pattern, match => `<span class='highlight'>${match}</span>`) 
    
    if (!note.indexOf(highlightedNote)) {
      categories[categories.length-1].notes.push(note)
    }
    for (const category of categories) {
      for (const keyword of category.keywords) {
        const pattern = new RegExp('\\b' + keyword + '\\b', 'gi')
        if (pattern.test(highlightedNote)) {
          category.notes.push(highlightedNote)
          break
        }
      }
    }
  }

  // Remove duplicate notes in Sales if they already appear in Service
  for (const category of categories) {
    let serviceNotes
    let salesNotes

    if (category.name === 'SERVICE' && Boolean(category.notes)) {
      serviceNotes = category.notes
    }
    console.log(category.name, serviceNotes)
    /*
    if (category.name === 'SALES' && Boolean(category.notes)) {
      salesNotes = category.notes
    }
    console.log(category.name, salesNotes)
    
    for (let salesNote of salesNotes) {
      salesNotes.filter(note => {
        return note !== [salesNote]
      })
    }
    */
  }
}

/*
const markNotes = () => {
  const priorities = categories.length
  const names = categories.flatMap(c => c.name).join(',').toLocaleLowerCase().split(',')
  const keywords = categories.flatMap(c => c.keywords)

  let instances = []
  instances.length = priorities;
  for (let name of names) {
    name = new Mark(document.querySelector(`.details-${name}`))
    
    name.mark(keywords, {
      "element": "span",
      "className": "highlight",
      "separateWordSearch": "false",
      "exclude": ["a"],
      "diacritics": "false",
      "wildcards": "disabled", // this default is stated incorrectly in the API docs
      "accuracy": "exactly",
      "filter": function(textNode, foundTerm, totalCounter, counter) {
        console.log(`Highlighted: ${foundTerm}`)
        return true; // must return either true or false
      },
      // these don't work with regex
      // "value": "exactly",
      // "acrossElements": false,
      // "limiters": [",", "."],
      // "debug": "true",
      // "log": window.console
    }
  )}
}
*/

const fetchNotes = async (json = '/api/notes.json') => {
  const response = await fetch(json)
  const notes = await response.json()
  return notes
}

const displayNotes = (notes) => {
  let displayedNote
  for (const category of categories) {
    displayedNote += `<h4>${category.name}</h4>`
    displayedNote += `<div class="details-${category.name.toLocaleLowerCase()}">`
    for (let [i, note] of category.notes.entries()) {
      displayedNote += `<ul><span class="num">${i + 1}.</span>${note}</ul>`
    }
    displayedNote += `</div>`
  }
  return displayedNote
}

const pipeline = (f, g) => (...args) => g(f(...args));

const refreshNotes = async () => {
  for (const category of categories) {
    category.notes.length = 0
  }
  const notes = await fetchNotes()
	const formattedNotes = formatNotes(notes)
	const groupedNotes = groupNotes(formattedNotes)
  const content = document.querySelector('.content')
  content.innerHTML = displayNotes(groupedNotes)
  // markNotes()
}

async function saveFile(input) {
  let formData = new FormData()
  const file = input.files[0]
  const ext = file.name.indexOf('.') != -1 &&
  file.name.substr(file.name.lastIndexOf('.') + 1, file.name.length)
  if (ext === 'csv') {
    formData.append("file", file)
    await fetch('/api/upload', {method: "POST", body: formData})
    refreshNotes()
  }
  else {
    alert("Please choose a file with a file with a .csv extension.")
  }
}

const input = document.querySelector('input[type="file"]')
input.addEventListener('change', () => saveFile(input))

window.addEventListener('DOMContentLoaded', refreshNotes)
