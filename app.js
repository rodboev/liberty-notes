let notes = require('./notes.json');

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

let numHighlighted = 0;

for (const note of notes) {
  // Highlight keywords in notes
  const pattern = new RegExp(keywords.join('\\b|\\b'), 'gi'); 
  const noteHighlighted = note.replace(pattern, match => `=>${match}<=`);
  if (note.indexOf(noteHighlighted)) {
    // console.log(noteHighlighted + `\n`);
    numHighlighted++;
  }
  // console.log(`Highlighted ${numHighlighted} of ${notes.length}`);

  // Organize into groups
  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (noteHighlighted.includes(keyword)) {
        category.notes.push(noteHighlighted)
      }
    }
  }
}

console.log(JSON.stringify(categories));