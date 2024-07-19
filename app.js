const fs = require('fs')
const path = require('path')
const converter = require('json-2-csv')
const express = require('express')
const fileUpload = require('express-fileupload')
const hash = require('object-hash')
const { Tiktoken } = require('tiktoken/lite')
const cl100k_base = require('tiktoken/encoders/cl100k_base.json')
const { parse } = require('best-effort-json-parser')

const dotenv = require('dotenv')
dotenv.config()
const OpenAI = require('openai')
const prompts = require('./prompts.js')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const app = express()
const port = parseInt(process.env.PORT) || 3000
const timestamp = () => new Date().toLocaleTimeString()

// let allEmails = []
let generating = false
let globalEmails = []
let sseClients = []

const sendData = data => {
	// process.stdout.write('\x1Bc' + JSON.stringify(data))
	sseClients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`))
	console.log(`> [${timestamp()}] Sent ${data.length} emails to ${sseClients.length} clients`)
}

const throttle = (func, limit) => {
  let lastFunc
  let lastRan
  return function (...args) {
    if (!lastRan) {
      func.apply(this, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(function () {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

const throttledSendData = throttle(sendData, 1000)

async function requestEmails({ prompts, notes, model, encoding }) {
	const merge = (arrayList1, arrayList2) => [ ...[]
		.concat(arrayList1, arrayList2)
		.reduce((r, c) => 
			r.set(c.fingerprint, Object.assign(r.get(c.fingerprint) || {}, c)), 
			new Map()
		)
		.values()
	]
	
	// Build user prompt from base prompt and notes
	const userPrompt = prompts.base + JSON.stringify(notes.map(note => ({
		tech: note['Added By'],
		company: note['Company'],
		note: note['Note'],
		date: note['Note Date'],
		fingerprint: note.fingerprint
	})))

	console.log(prompts.system)
	console.log(userPrompt)
	
	const promptTokens = encoding.encode(userPrompt + prompts.system).length
	console.log(`> [${timestamp()}] Requested: ${notes.length} emails with context length: ${promptTokens} tokens`)
	generating = true

	try {
		const startTime = Date.now()
		const stream = await openai.chat.completions.create({
			model,
			stream: true,
			response_format: { type: "json_object" },
			messages: [
				{
					"role": "system", "content": prompts.system,
				},
				{
					"role": "user", "content": userPrompt
				}
			],
			seed: 0,
		})

		// Join stream data into response, update globalEmails
		let emailsJson = ``
		let completionTokens = 0
		let scopedEmails = []

		for await (const response of stream) {
			const chunk = response.choices[0].delta.content
			const status = response.choices[0].finish_reason
			if (!status) {
				// In progress
				completionTokens++
				// process.stdout.write(chunk)
				emailsJson += chunk
				const emails = parse(emailsJson.trimStart())?.emails ?? []
				const filteredEmails = emails.filter(email => email.fingerprint?.length === 40)
				globalEmails = merge(globalEmails, filteredEmails)
				throttledSendData(globalEmails)
			}
			else if (status === 'stop') {
				// Completed
				const emails = parse(emailsJson)
				const endTime = Date.now()
				const secs = Math.round(((endTime - startTime) / 1000) * 10) + ' secs'
				console.log(`> [${timestamp()}] Received: ${scopedEmails.length} of ${notes.length} emails in ${secs}, used ${(completionTokens)} tokens`)
				generating = false
				return emails
			}
			else {
				// Stopped before completion
				console.error(`> [${timestamp()}] Error: Bad response from request with ${promptTokens}, finish reason: ${status}`)
				generating = false
				return []
			}
		}
	}
	catch (error) {
		console.error(`> [${timestamp()}] API Error: ${error}`)
		return []
	}
}

app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
}))

app.post('/api/upload', async function(req, res) {
	try {
		console.log(`> [${timestamp()}] POST ${req.url}`)
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
			keys: ['Note Time', 'Note Date', 'Company', 'Location Code', 'Location ID', 'Note Code', 'Note', 'Added By']
		})

		// Fingerprint and save
		const notes = jsonData.map(note => ({
			...note,
			fingerprint: hash(note),
		}))
		await fs.promises.writeFile(files.notes, JSON.stringify(notes, null, 2))
		console.log(`> [${timestamp()}] Saved: ${files.notes} (${notes.length} notes)`)
		res.write(`${notes.length} notes saved`)

		// Take just 911 notes and chunk them
		const filteredNotes = notes.filter(note => note['Note Code'] === '911 EMER')
		const model = 'gpt-4o'
		const chunkSize = model === 'gpt-4o' ? 15 : 5
		const chunkArray = (array, chunkSize) => {
			const chunks = []
			for (let i = 0; i < array.length; i += chunkSize) {
				chunks.push(array.slice(i, i + chunkSize))
			}
			return chunks
		}
		const noteChunks = chunkArray(filteredNotes, chunkSize)

		// Start all requests concurrently and process emails as they come in
		const encoding = new Tiktoken(
			cl100k_base.bpe_ranks,
			cl100k_base.special_tokens,
			cl100k_base.pat_str
		)

		const emailPromises = noteChunks.map(async chunk => {
			const emails = await requestEmails({
				prompts,
				notes: chunk,
				model,
				encoding
			}) || []
			await fs.promises.writeFile(files.emails, JSON.stringify(globalEmails, null, 2))
			console.log(`> [${timestamp()}] Saved: ${files.emails} (${emails.length} emails, ${globalEmails.length} total so far)`)
			return emails
		})
		await Promise.all(emailPromises)

		encoding.free()
		console.log(`> [${timestamp()}] Completed: Saved ${globalEmails.length} total emails`)
		res.end(`${globalEmails.length} total emails saved`)
	}
	catch (error) {
		console.error(`> [${timestamp()}] `, error)
		res.send(`Something went wrong: ${error}`)
	}
})

app.get('/api/emails', async (req, res) => {
	console.log(`> [${timestamp()}] GET ${req.url}`)

	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')
  
	// Register client for SSE and send initial data
  sseClients.push(res)
  sendData(globalEmails)
	
	req.on('close', () => {
		sseClients = sseClients.filter(client => client !== res)
		res.end()
	})
})

app.get('/api/notes', async (req, res) => {
	console.log(`> [${timestamp()}] GET ${req.url}`)
	try {
		const data = await fs.promises.readFile('data/notes.json', 'utf8')
		res.send(data)
	} catch (error) {
		res.status(404).json(`{ message: "Not found: ${req.url}"}`)
	}
})

app.get('/api/emails/static', async (req, res) => {
	console.log(`> [${timestamp()}] GET ${req.url}`)
	try {
		const data = await fs.promises.readFile('data/emails.json', 'utf8')
		res.send(data)
	} catch (error) {
		res.status(404).json(`{ message: "Not found: ${req.url}"}`)
	}
})

app.use(express.static('public'))

app.listen(port, () => {
	console.log(`> [${timestamp()}] App listening on port ${port}...`)
})
