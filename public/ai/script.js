// On document load, get the div with id pairs and append <div class="pair"></div> as many times as there are elements in a variable named pairs

window.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('/api/emails')
  const emails = await response.json()
  const entries = document.getElementById('entries')

	emails.forEach(({ email, note }) => {
		const entry = document.createElement('div')
		entry.className = 'entry'
		entry.innerHTML = `
			<div class="note">
				<p><pre>${JSON.stringify(note, null, 4)}</pre></p>
			</div>
			<div class="email">
				<input class="subject" value="${email.subject}"></input>
				<div class="body"></div>
			</div>
		`

		const bodyEditor = new Quill(entry.querySelector('.email .body'), {
			theme: 'snow',
		})
		bodyEditor.root.innerHTML = email.body

		entries.appendChild(entry)
	})
})

function exportHTML() {
  const html = quill.root.innerHTML
}
