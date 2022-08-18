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
// console.log(`---\nLooking for keywords: ${keywords.join(', ')}`);

const matchingNotes = [];
const keywordsFound = [];

for (const note of notes) {
  // Get a full view of all matching keywords, if any
  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'gi');
    if (note.match(regex)) {
      keywordsFound.push(keyword);
      // Replace matching keyword with <<highlight>>. To be categorized, ordered and limited to single, highest priority keyword
      matchingNotes.push(note.replaceAll(keyword, `<<${keyword}>>`));
    }
  }

  /*
  if (keywordsFound.length > 0) {
    // replace each note keyword with <<keyword>>
    console.log(note.replaceAll(keyword, `<<${keyword}>>`));
  }
  */
}

console.log(matchingNotes.join(`\n\n`));
console.log(`Found ${matchingNotes.length} of ${notes.length} notes with matching keywords.`);
// console.log(`Keywords found (${keywordsFound.length}): ${keywordsFound.join(', ')}`);
