'use strict'

const categories = [
  {
    name: '911',
    keywords: [],
    notes: [],
    notesShown: []
  },
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
    notes: [],
    notesShown: []
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
    notes: [],
    notesShown: []
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
      'needs',
    ],
    // regex: /\bentry( ?way| point)?s?\b|\brecommend.+?\b|\bneed.+?\b/,
    notes: [],
    notesShown: []
  },
  {
    name: 'UNCATEGORIZED',
    keywords: [],
    notes: [],
    notesShown: []
  }
]

const getCategoryIndex = (name) => {
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].name === name) {
      return i;
    }
  }
  return -1;
}

const formatNotes = (notes) => {
  const formattedNotes = []
  const url = "https://app.pestpac.com/location/detail.asp?LocationID="

  for (const note of notes) {
    if (note.hasOwnProperty('Note')) {
      const namesToExclude = ['MIRIAM', 'CAROLINE', 'JAMESGAMM']
      if (!namesToExclude.includes(note['Added By'])) {
        const formattedNote = structuredClone(note)
        
        formattedNote.formatted =
          `<h5>Name:</h5><a href="${url}${note['Location ID']}" target="_new">${note['Company']}</a>
          <a class="code" href="${url}${note['Location ID']}" target="_new">[${note['Location Code']}]</a><br />
          <h5>Code:</h5>${note['Note Code']}<br />
          <h5>Note:</h5><span class="note">${note['Note']
            .replace(/^Service: /, "")
            .replace(/\s{2,}/g, "<br />")}
          </span><br />
          <h5>From:</h5>${note['Added By']}</span>`
        
        formattedNotes.push(formattedNote)
      }
    }
    else {
      alert(`Couldn't find a "Note" column`)
      break
    }
  }

  return formattedNotes
}

const groupNotes = (notes) => {
  const keywords = categories.flatMap(c => c.keywords)
  
  for (const note of notes) {
    if (note['Note Code'] === '911 EMER') {
      categories[getCategoryIndex('911')].notes.push(note.formatted)
    }

    const pattern = new RegExp(keywords.join('\\b|\\b'), 'gi')
    const highlightedNote = note.formatted.replace(pattern, match => `<span class='highlight'>${match}</span>`) 
    if (!note.formatted.indexOf(highlightedNote)) {
      categories[getCategoryIndex('UNCATEGORIZED')].notes.push(note.formatted)
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

  // Remove Service notes that already appear in Sales
  /*
  for (const category of categories) {
    let serviceNotes = []
    let salesNotes = []

    if (category.name === 'SERVICE') {
      serviceNotes = categories[0].notes
    }
    if (category.name === 'SALES') {
      salesNotes = categories[2].notes
    }

    for (const salesNote of salesNotes) {
      if (serviceNotes.includes(salesNote)) {
        salesNotes.filter(entries => {
          return entries !== salesNote
        })
      }
    }
  }
  */
  return notes
}

const fetchNotes = async (json = '/api/notes.json') => {
  const response = await fetch(json)
  const notes = await response.json()
  return notes
}

const renderCategories = (notes) => {
  let rendered = ''
  for (const category of categories) {
    rendered += `<h4>${category.name}</h4>`
    rendered += `<div class="details-${category.name.toLocaleLowerCase()}">`
    // Take out notes in Sales that already appear in Service
    if (category.name !== 'SALES') {
      for (let [i, note] of category.notes.entries()) {
        rendered += `<ul><span class="num">${i + 1}.</span>${note}</ul>`
      }
    }
    else {
    }
      /*
      if (category.name === 'SALES' && category.notes.includes(notes2)) {
        // categories[0].notesShown.push(note)
      }
      */
  rendered += `</div>`
  } 
  return rendered
}

const refreshNotes = async () => {
  for (const category of categories) {
    category.notes.length = 0
    category.notesShown.length = 0
  }
  
  const notes = await fetchNotes()
  const content = document.querySelector('.content')
  const pipeline = (...fns) => fns.reduce((f, g) => (...args) => g(f(...args)))
  content.innerHTML = pipeline(formatNotes, groupNotes, renderCategories)(notes)
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
