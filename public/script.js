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

const prefixNotes = (notes) => {
	const prefixedNotes = [];
	for (let [i, note] of notes.entries()) {
		note = `<span class="num">${i + 1}.</span> ${note.replace(/^Service: /, "")}`
		prefixedNotes.push(note);
	}
	return prefixedNotes
}

const cleanNotes = (notes) => {
	let cleanedNotes = [];
	let cleanedWords = [];

	for (let note of notes) {
		let words = note.join(' ').split(/\s+/)
			.filter(w => w.length > 4 && !/[<>/]/.test(w))
		words = words.filter((v, i) => words.indexOf(v) === i) // remove dupes
		for (let word of words) {
			word = word.replace(/([:&.])/g, "$1 ")
			cleanedWords.push(word);
		}
		console.log(cleanedWords);
	}

	for (let note in notes) {
		if (note.indexOf(word) !== -1) {
			note = note.replace(/[\W_]|([a-z])(?=[A-Z])/g, "$1 ")
				.replace(/[\W_]|([A-Z])(?=[a-z])/g, "$1 ")
				.replace(/([A-Z].*)([A-Z].*)/g, "$1 $2 ")
		}
		cleanedNotes.push(note)
	}
	console.log(cleanedNotes)
	return cleanedNotes
}

const groupNotes = (notes) => {
	let keywords = categories.flatMap(c => c.keywords)
	/*
	
	console.log(words)
	*/

	// Highlight keywords in notes
	const pattern = new RegExp(keywords.join('\\b|\\b'), 'gi')

	// Match misspellings
	let i = 0;
	for (const keyword of keywords) {
		if (i < 100) {
			for (const note of notes) {
				for (const word of note.split(/\s+/)) {
					if (stringSimilarity.compareTwoStrings(word, keyword) > 0.8) {
						keywords.push(word)
					}
				}
			}
		}
		i++;
	}

	for (const note of notes) {
		const highlightedNote = note.replace(pattern, match => `<span class='highlight'>${match}</span>`);
		
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

const fetchNotes = async (json = '/notes.json') => {
	const response = await fetch(json);
	const notes = await response.json();
	return notes;
}

const displayNotes = (notes) => {
	let data = '';
	for (const category of categories) {
		data += `<h4>${category.name}</h4>`
		for (const note of category.notes) {
			data += `<ul>${note}</ul>`
		}
	}
	return data;
}

window.addEventListener('DOMContentLoaded', async () => {
	const content = document.querySelector('.content');
	const notes = await fetchNotes();
	// const cleanedNotes = cleanNotes(notes);
	const prefixedNotes = prefixNotes(notes);
	const groupedNotes = groupNotes(prefixedNotes);
	content.innerHTML = displayNotes(groupedNotes);
});
