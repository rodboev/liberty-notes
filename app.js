const notes = require('./notes.json');

const categories = [
  {
    category: 'SERVICE',
    priority: 1, // == highest
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
    ]
  },
  {
    category: 'KEY',
    priority: 2,
    keywords: [
      'key',
      'keys',
      'lockbox',
      'lock box',
    ]
  },
  {
    category: 'SALES',
    priority: 3,
    keywords: [
      'entry point',
      'entry points',
      'recommend',
      'recommended',
      'recommendation',
      'need',
      'needs'
    ]
  }
]

const keywords = categories.flatMap(c => c.keywords)

let notesHighlighted = 0;
for (const note of notes) {
  const pattern = new RegExp(keywords.join('\\b|\\b'), 'gi'); 
  const highlighted = note.replace(pattern, match => `=>${match}<=`);
  if (note.indexOf(highlighted)) {
    console.log(highlighted + `\n`);
    notesHighlighted++;
  }
}
console.log(`Highlighted ${notesHighlighted} of ${notes.length}`);

// TODO: Organize into categories and prioritize highest, ending with one
