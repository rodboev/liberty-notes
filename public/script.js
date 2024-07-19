'use strict'

const timestamp = () => new Date().toLocaleTimeString()

const categories = [
  {
    name: '911',
    keywords: [],
    entries: [],
    entriesShown: []
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
    entries: [],
    entriesShown: []
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
    entries: [],
    entriesShown: []
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
    entries: [],
    entriesShown: []
  },
  {
    name: 'UNCATEGORIZED',
    keywords: [],
    entries: [],
    entriesShown: []
  }
]

const getCategoryIndex = (name) => {
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].name === name) {
      return i
    }
  }
  return -1
}

const format = (notes) => {
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
          <h5>Note:</h5><span class="content">${note['Note']
            .replace(/^Service: /, "")
            .replace(/\s{2,}/g, "<br />")}
          </span><br />
          <h5>From:</h5>${note['Added By']}</span>`
        
        formattedNotes.push(formattedNote)
      }
    }
    else {
      console.error(`Couldn't find "Note" key in note (${note.length} bytes):`, note)
      break
    }
  }

  return formattedNotes
}

const group = (merged) => {
	const keywords = categories.flatMap(category => category.keywords)

	for (const category of categories) {
		category.entries.length = 0
		category.entriesShown.length = 0
	}

  for (const { note, email = null } of merged) {
		if (note['Note Code'] === '911 EMER') {
      categories[getCategoryIndex('911')].entries.push({ note: note.formatted, email })
			continue
    }

    const pattern = new RegExp(keywords.join('\\b|\\b'), 'gi')
    const highlightedNote = note.formatted.replace(pattern, match => `<span class='highlight'>${match}</span>`) 
    if (!note.formatted.indexOf(highlightedNote)) {
      categories[getCategoryIndex('UNCATEGORIZED')].entries.push({ note: note.formatted, email })
    }

    for (const category of categories) {
      for (const keyword of category.keywords) {
        const pattern = new RegExp('\\b' + keyword + '\\b', 'gi')
        if (pattern.test(highlightedNote)) {
          category.entries.push({ note: highlightedNote })
          break
        }
      }
    }
  }
}

const render = () => {
  let rendered = ''
  for (const category of categories) {
    rendered += `<section>`
    rendered += `<h4>${category.name}</h4>`
    rendered += `<div class="details-${category.name.toLocaleLowerCase()} entries">`
    if (category.name !== 'SALES') {
			category.entries.forEach(({ note, email = null }, index) => {
        rendered += `
					<div class="entry">
						<div class="note">
							<span class="num">${index + 1}.</span>${note}
						</div>`
				if (email) {
					rendered += `<div class="email">`
					if (!email.hasOwnProperty('error')) {
						rendered += `
							<input class="subject" value="${email.subject}"></input>
							<div class="body">${email.body}</div>`
					} else {
						rendered += `<div class="error">${email.error}</div>`
					}
					rendered += `</div>` // .email
				}
				rendered += `</div>` // .entry
      })
    }
    else {
			// Ignore notes in Sales that already appear in Service
    }
  rendered += `</div></section>`
  }

  return rendered
}


window.addEventListener('DOMContentLoaded', async function() {
	const notes = await getNotes()
	openEmailStream(notes)
})

let globalNotes, serverEmails

async function getNotes() {
	// Fetch notes (on load and after upload)
	[globalNotes, serverEmails] = await Promise.all([
		fetch('/api/notes').then(response => response.json()),
		fetch('/api/emails/static').then(response => response.json())
	])
}

function openEmailStream() {
	// Open email stream
	const emailEvents = new EventSource('/api/emails')

	emailEvents.addEventListener('message', event => {
		const emails = JSON.parse(event.data)
		// console.log(`> [${timestamp()}] Received data from server`, emails)
		joinAndRender({ emails, notes: globalNotes })
	})

	emailEvents.addEventListener('error', event => {
		console.warn('emailEvents failed:', event);
		emailEvents.close()
	})
}

function joinAndRender({ notes = null, emails} ) {
	if (emails.length === 0) emails = serverEmails

	// Format notes and merge with emails
	const leftJoin = ({ notes, emails = [] }) => notes.map(note => ({
		note,
		email: emails.find(email => email.fingerprint === note.fingerprint),
	}))
	const joined = leftJoin({ emails, notes: format(notes) })

	// Sort joined by note['Note Date'] + note['Note Time']
	joined.sort((a, b) => {
		const aDate = new Date(`${a.note['Note Date']} ${a.note['Note Time']}`)
		const bDate = new Date(`${b.note['Note Date']} ${b.note['Note Time']}`)
		return aDate - bDate
	})
	
	// Group into sections and render
	group(joined)

	const content = document.querySelector('#content')

	const offscreenDiv = document.createElement('div')
	offscreenDiv.style.display = 'none'
	document.body.appendChild(offscreenDiv)
	offscreenDiv.innerHTML = `<div id="content">${render()}</div>`
	$(offscreenDiv).find('.email .body').summernote({
		toolbar: [
			['style', ['bold', 'underline', 'italic']],
			['lists', ['ul', 'ol']]
		]
	})
	morphdom(content, offscreenDiv.innerHTML)
	document.body.removeChild(offscreenDiv);

	console.log(`> [${timestamp()}] Updated with ${notes.length} notes and ${emails.length} emails`)
}

async function putNotes(input) {
	let formData = new FormData()
	const file = input.files[0]
	const ext = file.name?.indexOf('.') != -1 && file.name.substr(file.name?.lastIndexOf('.') + 1, file.name?.length)
	if (ext === 'csv') {
		formData.append("file", file)
		await fetch('/api/upload', { method: "POST", body: formData })
	}
	else {
		alert("Please choose a file with a file with a .csv extension.")
	}
}

const input = document.querySelector('input[type="file"]')
input.addEventListener('change', async function() {
	await putNotes(input)
	getNotes()
})

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