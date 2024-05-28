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
			continue
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
    rendered += `<section>`
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
  rendered += `</div></section>`
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

  initNav()
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

/* ------------------ */
/* Section navigation */
/* ------------------ */
let checkNavVisibility;

function initNav() {
  const nav = document.querySelector('nav')
  const prevBtn = document.querySelector('button.prev')
  const nextBtn = document.querySelector('button.next')
  const sections = document.querySelectorAll('section')

  let currentSectionIndex = 0

  function showScrollButtons() {
    if (currentSectionIndex > 0) {
      prevBtn.style.opacity = '1'
      prevBtn.style.visibility = 'visible'
    }
    else {
      prevBtn.style.opacity = '0'
    }

    if (currentSectionIndex < sections.length - 1) {
      nextBtn.style.opacity = '1'
      nextBtn.style.visibility = 'visible'
    }
    else {
      nextBtn.style.opacity = '0'
    }
  }

  function checkSectionVisibility() {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      const rect = section.getBoundingClientRect()
      const visibleHeight = window.innerHeight * 0.5
      if (rect.top <= visibleHeight && rect.bottom >= visibleHeight) {
        //console.log(`y: ${document.body.scrollTop}, section: ${i}, top: ${rect.top}, bottom: ${rect.bottom}`)
        currentSectionIndex = i
        showScrollButtons()
        return
      }
    }

    prevBtn.style.opacity = '0'
    nextBtn.style.opacity = '0'
  }

  function handleButtonClick(event) {
    if (event.target === prevBtn) {
      currentSectionIndex = Math.max(0, currentSectionIndex - 1)
    }
    else if (event.target === nextBtn) {
      currentSectionIndex = Math.min(sections.length - 1, currentSectionIndex + 1)
    }
    sections[currentSectionIndex].scrollIntoView({ behavior: 'smooth' })
    showScrollButtons()
  }

  prevBtn.addEventListener('click', handleButtonClick)
  nextBtn.addEventListener('click', handleButtonClick)

  window.addEventListener('scroll', checkSectionVisibility, true)

  // Initial check
  checkSectionVisibility()

  clearInterval(checkNavVisibility)
  checkNavVisibility = setInterval(() => {
    if (window.getComputedStyle(prevBtn).opacity == '0') prevBtn.style.visibility = 'hidden'
    if (window.getComputedStyle(nextBtn).opacity == '0') nextBtn.style.visibility = 'hidden'
  }, 250)
}