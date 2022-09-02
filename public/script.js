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

const groupNotes = (notes) => {
	const keywords = categories.flatMap(c => c.keywords)

	for (const note of notes) {
		// Highlight keywords in notes
		const pattern = new RegExp(keywords.join('\\b|\\b'), 'gi'); 
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

const fetchNotes = async (json = 'notes.json') => {
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
	const prefixedNotes = prefixNotes(notes);
	const groupedNotes = groupNotes(prefixedNotes);
	content.innerHTML = displayNotes(groupedNotes);
});

