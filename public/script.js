'use strict';

const categories = [
  {
    name: 'SERVICE',
    priority: 1, // highest priority
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
  },
	{
		name: 'UNCATEGORIZED',
		keywords: [],
		notes: []
	}
]

const formatNotes = (notes) => {
	const formattedNotes = [];
	for (let note of notes) {
		if (note.hasOwnProperty('Note')) {
			note = `<h5>Name:</h5><a href="https://app.pestpac.com/location/detail.asp?LocationID=${note['Location ID']}">${note['Company']}</a><br />
				<h5>Code:</h5><a href="https://app.pestpac.com/location/detail.asp?LocationID=${note['Location ID']}">${note['Location Code']}</a><br />
				<h5>Note:</h5><span class="note">${note['Note']
					.replace(/^Service: /, "")
					.replace(/\s{2,}/g, "<br />")
				}</span><br />
				<h5>From:</h5>${note['Added By']}</span>`
				formattedNotes.push(note)
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
		// Highlight keywords in notes
		const pattern = new RegExp(keywords.join('\\b|\\b'), 'gi'); 
		const highlightedNote = note.replace(pattern, match => `<span class='highlight'>${match}</span>`)
		
		// If no highlights, push to last category
		if (!note.indexOf(highlightedNote)) {
			categories[categories.length-1].notes.push(note);
		}

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
}

const fetchNotes = async (json = '/api/notes.json') => {
	const response = await fetch(json)
	const notes = await response.json()
	return notes;
}

const displayNotes = (notes) => {
	let data = '';
	for (const category of categories) {
		data += `<h4>${category.name}</h4>`
		for (let [i, note] of category.notes.entries()) {
			data += `<ul><span class="num">${i + 1}.</span>${note}</ul>`
		}
	}
	return data;
}

const refreshNotes = async () => {
	for (const category of categories) {
		category.notes.length = 0
	}
	const notes = await fetchNotes()
	const formattedNotes = formatNotes(notes)
	const groupedNotes = groupNotes(formattedNotes)
	const content = document.querySelector('.content')
	content.innerHTML = displayNotes(groupedNotes)
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