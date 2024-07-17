const fs = require('fs')
const path = require('path')
const converter = require('json-2-csv')
const express = require('express')
const fileUpload = require('express-fileupload')
const hash = require('object-hash')
const { Tiktoken } = require('tiktoken/lite')
const cl100k_base = require('tiktoken/encoders/cl100k_base.json')

const dotenv = require('dotenv')
dotenv.config()
const OpenAI = require('openai')
const prompts = require('./prompts.js')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const app = express()
const port = parseInt(process.env.PORT) || 3000
const timestamp = () => new Date().toLocaleTimeString()

function chunkArray(array, chunkSize) {
	const chunks = [];
	for (let i = 0; i < array.length; i += chunkSize) {
			chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}

async function requestEmails({ prompts, notes, model, encoding }) {
	// Build user prompt from base prompt and notes
	const basePrompt = prompts.user + JSON.stringify(notes.map(note => ({
		tech: note['Added By'],
		company: note['Company'],
		note: note['Note'],
		date: note['Note Date'],
		fingerprint: note.fingerprint
	})))

	
	const tokens = encoding.encode(basePrompt + prompts.system).length
	console.log(`> [${timestamp()}] Requested ${notes.length} emails with context length: ${tokens} tokens`)

	const startTime = Date.now()
	const response = await openai.chat.completions.create({
		model,
		response_format: { type: "json_object" },
		messages: [
			{
				"role": "system", "content": prompts.system,
			},
			{
				"role": "user", "content": basePrompt
			}
		],
		seed: 0,
	})
	const endTime = Date.now()
	const secs = Math.round(((endTime - startTime) / 1000) * 10) + ' secs'

	// Only return emails when the response finished successfully
	if (response.choices[0].finish_reason !== 'stop') {
		console.error(`> [${timestamp()}] Error: Bad response from request with ${tokens}, finish reason: ${response.choices[0].finish_reason}`)
	}
	else {
		try {
			let emails = JSON.parse(response.choices[0].message.content)
			emails = (emails.hasOwnProperty('emails') ? emails.emails : (emails ? emails : []))

			// const formatUsage = obj => Object.entries(obj).map(([key, value]) => `${value} ${key.replaceAll('_tokens', '')}`).join(', ')
			console.log(`> [${timestamp()}] Received: ${emails.length} of ${notes.length} emails in ${secs}. Tokens: ${(response.usage.completion_tokens)}`)

			return emails
		}
		catch (error) {
			console.error(`> [${timestamp()}] Error: Couldn't parse response: ${error}`)
		}
	}
}

app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
}))

app.post('/api/upload', async function(req, res) {
	try {
		if (!req.files || Object.keys(req.files).length === 0) {
			res.status(400).send('No files were uploaded.')
			throw new Error('No files were uploaded.')
		}
		
		const files = {
			notes: 'data/notes.json',
			emails: 'data/emails.json',
		}

		// Convert uploaded CSV to JSON
		const data = req.files.file.data.toString('utf8').replaceAll('\r', '')
		const jsonData = await converter.csv2jsonAsync(data, {
			keys: ['Note Date', 'Note Time', 'Company', 'Location Code', 'Location ID', 'Note Code', 'Note', 'Added By']
		})
		// Fingerprint and save
		const notes = jsonData.map(note => ({
			...note,
			fingerprint: hash(note),
		}))
		await fs.promises.writeFile(files.notes, JSON.stringify(notes, null, 2))
		console.log(`> [${timestamp()}] Saved: ${files.notes} (${notes.length} notes)`)
		res.write(`${notes.length} notes saved`)

		// Take just 911 notes, create emails, and save
		const filteredNotes = notes.filter(note => note['Note Code'] === '911 EMER')
		const model = 'gpt-4o'
		const chunkSize = model === 'gpt-4o' ? 15 : 15
		const noteChunks = chunkArray(filteredNotes, chunkSize)

		
		
		// Start all requests concurrently and process emails as they come in
		let allEmails = []
		const encoding = new Tiktoken(
			cl100k_base.bpe_ranks,
			cl100k_base.special_tokens,
			cl100k_base.pat_str
		)

		const emailPromises = (noteChunks).map(async chunk => {
			const emails = await requestEmails({
				prompts,
				notes: chunk,
				model,
				encoding
			}) || []
			allEmails = allEmails.concat(emails)
			await fs.promises.writeFile(files.emails, JSON.stringify(allEmails, null, 2))
			console.log(`> [${timestamp()}] Saved: ${files.emails} (${emails.length} emails, ${allEmails.length} total so far)`)
			return emails
		})
		await Promise.all(emailPromises)

		encoding.free()
		console.log(`> [${timestamp()}] Saved ${allEmails.length} total emails`)
		res.end(`${allEmails.length} total emails saved`)
	}
	catch (error) {
		console.error(`> [${timestamp()}] `, error)
		res.status(500).send(`Something went wrong: ${error}`)
	}
})

app.get(['/api/notes', '/api/emails'], async (req, res) => {
	try {
		console.log(`> [${timestamp()}] Request: ${req.url}`)
		const file = `data${req.url.replace('/api', '')}.json`
		try {
			const data = await fs.promises.readFile(file, 'utf8')
			res.send(data)
		} catch (error) {
			res.status(404).json(`{ message: "Not found: ${req.url}"}`)
		}
	}
	catch (error) {
		console.error(`> [${timestamp()}] `, error)
		res.status(500).json(error)
	}
})

app.use(express.static('public'))

app.listen(port, () => {
	console.log(`> [${timestamp()}] App listening on port ${port}...`)
})
