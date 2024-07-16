const fs = require('fs')
const path = require('path')
const converter = require('json-2-csv')
const express = require('express')
const fileUpload = require('express-fileupload')
const hash = require('object-hash')

const dotenv = require('dotenv')
dotenv.config()
const OpenAI = require('openai')
const prompts = require('./prompts.js')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const app = express()
const port = parseInt(process.env.PORT) || 3000
const timestamp = () => new Date().toLocaleTimeString()

async function requestEmails({ user, system }) {
	const kb = bytes => Math.round(bytes / 1024 * 10) / 10 + 'kb'
	try {
		// Will need to split every 16k tokens (~64kb) for context length max
		const inputLength = system.length + user.length
		if (inputLength > 60 * 1024) {
			throw new Error(`Input too long: ${inputLength} bytes`)
		}
		else {
			console.log(`> [${timestamp()}] Requesting emails with context length ${kb(inputLength)} (${kb(system.length)} system prompt, ${kb(user.length)} question)...`)
		}

		const startTime = Date.now()
		const response = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			response_format: { type: "json_object" },
			messages: [
				{
					"role": "system", "content": system,
				},
				{
					"role": "user", "content": user
				}
			],
			seed: 0,
		})
		const endTime = Date.now()

		const emails = JSON.parse(response.choices[0].message.content).emails
		const formatUsage = obj => Object.entries(obj).map(([key, value]) => `${value} ${key.replaceAll('_tokens', '')}`).join(', ')
		console.log(`> [${timestamp()}] Received ${emails.length} emails (${kb(JSON.stringify(response).length)}) in ${(endTime - startTime) / 1000} secs. Tokens: ${formatUsage(response.usage)}`)

		return emails
	}
	catch (error) {
		console.error(`Can't create emails: ${error}`)
	}
}

app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
}))

app.post('/api/upload', async function(req, res) {
	try {
		if (!req.files || Object.keys(req.files).length === 0) {
			return res.status(400).send('No files were uploaded.')
			throw new Error('No files were uploaded.')
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
		await fs.promises.writeFile('data/notes.json', JSON.stringify(notes, null, 2))
		console.log(`> [${timestamp()}] Saved: data/notes.json (${notes.length} notes)`)
		res.write('Notes saved.')

		// Take just 911 notes, create emails, merge with notes, and save
		const filteredNotes = notes.filter(note => note['Note Code'] === '911 EMER').slice(0, 10)

		const emails = await requestEmails({
			system: prompts.system,
			user: prompts.user + JSON.stringify(filteredNotes)
		})
		// const merge = (notes, emails) => notes.map(note => ({
		// 	email: emails.find(email => email.fingerprint === note.fingerprint),
		// 	note
		// }))
		const merge = (emails, notes) => emails.map(email => ({
			email,
			note: notes.find(note => note.fingerprint === email.fingerprint)
		}))

		const mergedEmails = merge(emails, filteredNotes)
		await fs.promises.writeFile('data/emails.json', JSON.stringify(mergedEmails, null, 2))
		console.log(`> [${timestamp()}] Saved: data/emails.json (${mergedEmails.length} emails)`)
		res.end('Emails saved.')
	}
	catch (error) {
		console.error(error)
		res.status(500).send(`Something went wrong: ${error}`)
	}
})

app.get(['/api/notes', '/api/emails'], async (req, res) => {
	try {
		console.log(`> [${timestamp()}] Request: ${req.url}`)
		const file = `data${req.url.replace('/api', '')}.json`
		const data = await fs.promises.readFile(file, 'utf8')
		res.send(data)
	}
	catch (error) {
		console.error(error)
		res.status(500).json(error)
	}
})

app.use(express.static('public'))

app.listen(port, () => {
	console.log(`> [${timestamp()}] App listening on port ${port}...`)
})
