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
      'keys'
    ]
  },
  {
    category: 'SALES',
    priority: 3,
    keywords: [
      'recommend',
      'recommended',
      'recommendation'
    ]
  }
]

const keywords = categories.flatMap(c => c.keywords)
console.log(`---\nLooking for keywords: ${keywords.join(', ')}`);

let keywordsFound = [];
for (note of notes) {
  console.log(`\nTesting note: ${note}`);
  keywordsFound = [];
  for (keyword of keywords) {
    const regex = new RegExp(keyword, 'g');
    if (note.match(keyword)) {
      keywordsFound.push(keyword);
    }
  }
  if (keywordsFound.length > 0) {
    console.log(`Keywords found: ${keywordsFound}`);
  }
  else {
    console.log(`No keywords found, skipping this note.`);
  }
}
