// Modifié par iSHEERO le 2026-10-14 (DocuSeal 3.3.0, AGPLv3) : import d'une liste de destinataires
// pour app/views/submissions/_list_form.html.erb. Lit un CSV (virgule ou point-virgule) ou des lignes
// collées depuis Excel (tabulations), puis crée un envoi par ligne via le formulaire standard.
// Aucune dépendance : servi par Rails depuis /isheero/bulk-import.js (CSP script-src 'self').
(() => {
  'use strict'

  const EMAIL_HEADERS = ['email', 'e-mail', 'mail', 'courriel', 'adresse email', 'adresse e-mail']
  const NAME_HEADERS = ['nom', 'name', 'nom complet', 'full name', 'prenom nom', 'destinataire']
  const EMAIL_RE = /^[^@\s<>;,"]+@[^@\s<>;,"]+\.[^@\s<>;,"]+$/

  function normalizeHeader (value) {
    return String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
  }

  function detectDelimiter (firstLine) {
    if (firstLine.includes('\t')) return '\t'

    const semicolons = (firstLine.match(/;/g) || []).length
    const commas = (firstLine.match(/,/g) || []).length

    return semicolons >= commas && semicolons > 0 ? ';' : ','
  }

  // CSV RFC 4180 : guillemets doubles, "" échappé, retours à la ligne dans un champ entre guillemets.
  function parseDelimited (text, delimiter) {
    const rows = []
    let row = []
    let field = ''
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]

      if (inQuotes) {
        if (char === '"' && text[i + 1] === '"') {
          field += '"'
          i++
        } else if (char === '"') {
          inQuotes = false
        } else {
          field += char
        }
      } else if (char === '"' && field === '') {
        inQuotes = true
      } else if (char === delimiter) {
        row.push(field)
        field = ''
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i++
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      } else {
        field += char
      }
    }

    if (field !== '' || row.length > 0) {
      row.push(field)
      rows.push(row)
    }

    return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''))
  }

  // fields : [{ uuid, name }] des champs préremplissables du modèle.
  function buildRecipients (text, fields) {
    const result = { recipients: [], errors: [], ignoredColumns: [] }
    const cleaned = String(text).replace(/^﻿/, '')

    if (cleaned.trim() === '') return result

    const firstLine = cleaned.split(/\r?\n/, 1)[0]
    const rows = parseDelimited(cleaned, detectDelimiter(firstLine))
    const header = rows[0].map(normalizeHeader)
    const emailIndex = header.findIndex((h) => EMAIL_HEADERS.includes(h))
    const nameIndex = header.findIndex((h) => NAME_HEADERS.includes(h))

    if (emailIndex === -1) {
      result.errors.push('Colonne « email » introuvable dans la ligne d\'en-tête.')

      return result
    }

    const fieldColumns = []

    header.forEach((h, index) => {
      if (index === emailIndex || index === nameIndex || h === '') return

      const field = fields.find((f) => normalizeHeader(f.name) === h)

      if (field) {
        fieldColumns.push({ index, uuid: field.uuid })
      } else {
        result.ignoredColumns.push(rows[0][index].trim())
      }
    })

    const seen = new Set()

    rows.slice(1).forEach((cells, offset) => {
      const line = offset + 2
      const email = (cells[emailIndex] || '').trim().toLowerCase()

      if (!EMAIL_RE.test(email)) {
        result.errors.push(`Ligne ${line} : adresse e-mail invalide « ${email} ».`)

        return
      }

      if (seen.has(email)) {
        result.errors.push(`Ligne ${line} : ${email} apparaît plusieurs fois.`)

        return
      }

      seen.add(email)

      const values = {}

      fieldColumns.forEach(({ index, uuid }) => {
        const value = (cells[index] || '').trim()

        if (value !== '') values[uuid] = value
      })

      result.recipients.push({ email, name: nameIndex === -1 ? '' : (cells[nameIndex] || '').trim(), values })
    })

    return result
  }

  // Excel enregistre souvent en Windows-1252 : repli si le fichier n'est pas de l'UTF-8 valide.
  function decodeFile (buffer) {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    } catch (_error) {
      return new TextDecoder('windows-1252').decode(buffer)
    }
  }

  const api = { normalizeHeader, detectDelimiter, parseDelimited, buildRecipients, decodeFile }

  if (typeof module !== 'undefined' && module.exports) module.exports = api

  if (typeof window === 'undefined' || typeof customElements === 'undefined' || customElements.get('isheero-bulk-import')) return

  function hiddenInput (name, value) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value

    return input
  }

  customElements.define('isheero-bulk-import', class extends HTMLElement {
    connectedCallback () {
      this.fields = JSON.parse(this.dataset.fields || '[]')
      this.form = this.closest('form')
      this.submit = this.form.querySelector('[data-role="isheero-bulk-submit"]')

      this.querySelector('[data-role="file"]').addEventListener('change', (event) => this.readFile(event.target.files[0]))
      this.querySelector('[data-role="paste"]').addEventListener('input', (event) => this.render(event.target.value))
    }

    readFile (file) {
      if (!file) return

      if (/\.xlsx?$/i.test(file.name)) {
        this.render('', ['Fichier Excel : l\'enregistrer en CSV, ou copier-coller les lignes dans la zone ci-dessous.'])

        return
      }

      file.arrayBuffer().then((buffer) => {
        const text = decodeFile(buffer)

        this.querySelector('[data-role="paste"]').value = text
        this.render(text)
      })
    }

    render (text, extraErrors = []) {
      const { recipients, errors, ignoredColumns } = buildRecipients(text, this.fields)
      const allErrors = extraErrors.concat(errors)
      const inputs = this.querySelector('[data-role="inputs"]')
      const errorList = this.querySelector('[data-role="errors"]')
      const uuid = this.dataset.submitterUuid

      inputs.replaceChildren()
      errorList.replaceChildren(...allErrors.map((message) => {
        const item = document.createElement('li')
        item.textContent = message

        return item
      }))

      recipients.forEach((recipient, index) => {
        const prefix = `submission[${index + 1}][submitters][]`

        inputs.append(hiddenInput(`${prefix}[uuid]`, uuid), hiddenInput(`${prefix}[email]`, recipient.email))
        if (recipient.name) inputs.append(hiddenInput(`${prefix}[name]`, recipient.name))
        Object.entries(recipient.values).forEach(([fieldUuid, value]) => {
          inputs.append(hiddenInput(`${prefix}[values][${fieldUuid}]`, value))
        })
      })

      const summary = [`${recipients.length} destinataire(s) prêt(s).`]
      if (ignoredColumns.length) summary.push(`Colonnes ignorées : ${ignoredColumns.join(', ')}.`)
      if (allErrors.length) summary.push('Corrigez les erreurs pour pouvoir envoyer.')
      this.querySelector('[data-role="summary"]').textContent = text.trim() === '' && !allErrors.length ? '' : summary.join(' ')

      if (this.submit) this.submit.disabled = recipients.length === 0 || allErrors.length > 0
    }
  })
})()
