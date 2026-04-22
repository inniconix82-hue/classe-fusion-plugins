import React, { useRef, useCallback, useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import { marked } from 'marked'

interface TextEditorPanelProps {
  onClose: () => void
  initialContent?: string
  rawMarkdown?: string
  onContentChange?: (html: string) => void
}

const FONT_SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '48']
const FONTS = [
  { label: 'Défaut', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Segoe UI', value: "'Segoe UI', sans-serif" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Palatino', value: "'Palatino Linotype', Palatino, serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Consolas', value: "Consolas, 'Courier New', monospace" },
  { label: 'Impact', value: 'Impact, sans-serif' },
]

const QUICK_LAYOUTS = [
  {
    label: '📋 Compte-rendu',
    html: `<h1>Compte-rendu de réunion</h1><p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p><p><strong>Participants :</strong> </p><h2>Ordre du jour</h2><ul><li>Point 1</li><li>Point 2</li></ul><h2>Décisions prises</h2><ul><li></li></ul><h2>Actions à suivre</h2><ul><li><strong>Responsable :</strong> Action — Échéance : </li></ul>`,
  },
  {
    label: '📧 Email professionnel',
    html: `<p>Madame, Monsieur,</p><p>Je me permets de vous contacter au sujet de </p><p></p><p>Cordialement,<br/><strong>Votre nom</strong></p>`,
  },
  {
    label: '📑 Rapport',
    html: `<h1>Rapport</h1><h2>Introduction</h2><p></p><h2>Développement</h2><p></p><h2>Conclusion</h2><p></p><h2>Recommandations</h2><ul><li></li></ul>`,
  },
  {
    label: '💡 Note rapide',
    html: `<h2>Note</h2><p></p><h3>Points clés</h3><ul><li></li><li></li></ul>`,
  },
  {
    label: '🗂️ Fiche projet',
    html: `<h1>Fiche projet</h1><p><strong>Nom du projet :</strong> </p><p><strong>Chef de projet :</strong> </p><p><strong>Date de début :</strong> ${new Date().toLocaleDateString('fr-FR')}</p><h2>Objectifs</h2><ul><li></li></ul><h2>Ressources</h2><ul><li></li></ul><h2>Jalons</h2><ul><li></li></ul>`,
  },
  {
    label: '📊 Analyse SWOT',
    html: `<h1>Analyse SWOT</h1><h2>Forces (Strengths)</h2><ul><li></li></ul><h2>Faiblesses (Weaknesses)</h2><ul><li></li></ul><h2>Opportunités (Opportunities)</h2><ul><li></li></ul><h2>Menaces (Threats)</h2><ul><li></li></ul>`,
  },
]

const TextEditorPanel: React.FC<TextEditorPanelProps> = ({
  onClose,
  initialContent = '',
  rawMarkdown = '',
  onContentChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [bgColor, setBgColor] = useState('#1a2744')
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)

  useEffect(() => {
    if (editorRef.current && initialContent) {
      const html = String(marked.parse(initialContent, { async: false, breaks: true, gfm: true }))
      editorRef.current.innerHTML = html
      editorRef.current.classList.add('ollama-formatted')
    }
  }, [initialContent])

  const exec = useCallback((command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }, [])

  const handleInput = useCallback(() => {
    if (onContentChange && editorRef.current) {
      onContentChange(editorRef.current.innerHTML)
    }
  }, [onContentChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
  }

  const exportToPDF = useCallback(() => {
    const el = editorRef.current
    if (!el || !el.textContent?.trim()) return

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 20
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const maxW = pageW - margin * 2
    let y = margin + 5

    const newPage = () => { doc.addPage(); y = margin + 5 }
    const roomCheck = (need: number) => { if (y + need > pageH - margin) newPage() }

    function write(text: string, size: number, style: 'normal' | 'bold' | 'italic', indent = 0) {
      const clean = text.replace(/\s+/g, ' ').trim()
      if (!clean) return
      doc.setFontSize(size)
      doc.setFont('helvetica', style)
      const lh = size * 0.38
      const lines = doc.splitTextToSize(clean, maxW - indent) as string[]
      lines.forEach((line) => { roomCheck(lh + 1); doc.text(line, margin + indent, y); y += lh + 1 })
    }

    function processEl(node: Element) {
      const tag = node.tagName?.toLowerCase()
      const txt = (node.textContent || '').replace(/\s+/g, ' ').trim()

      switch (tag) {
        case 'h1':
          y += 4; roomCheck(10)
          write(txt, 20, 'bold')
          doc.setDrawColor(80, 80, 200); doc.setLineWidth(0.4)
          doc.line(margin, y + 1, pageW - margin, y + 1)
          doc.setDrawColor(0, 0, 0); y += 5
          break
        case 'h2':
          y += 3; roomCheck(8); write(txt, 15, 'bold'); y += 2
          break
        case 'h3':
          y += 2; roomCheck(6); write(txt, 12, 'bold'); y += 1
          break
        case 'p':
          if (txt) { roomCheck(5); write(txt, 11, 'normal'); y += 2 }
          break
        case 'ul':
        case 'ol': {
          let idx = 0
          Array.from(node.children).forEach((li) => {
            if (li.tagName?.toLowerCase() !== 'li') return
            const liTxt = (li.textContent || '').replace(/\s+/g, ' ').trim()
            const bullet = tag === 'ul' ? '•' : `${++idx}.`
            roomCheck(5)
            doc.setFontSize(11); doc.setFont('helvetica', 'normal')
            doc.text(bullet, margin + 3, y)
            const lines = doc.splitTextToSize(liTxt, maxW - 10) as string[]
            lines.forEach((line, i) => { if (i > 0) roomCheck(5); doc.text(line, margin + 9, y); y += 5 })
            y += 1
          })
          y += 2
          break
        }
        case 'blockquote':
          roomCheck(6); write(txt, 11, 'italic', 6); y += 2
          break
        case 'br':
          y += 3
          break
        default:
          if (node.children.length > 0) {
            Array.from(node.children).forEach((child) => processEl(child))
          } else if (txt) {
            write(txt, 11, 'normal'); y += 2
          }
      }
    }

    Array.from(el.children).forEach((child) => processEl(child))
    if (y === margin + 5 && el.textContent?.trim()) {
      write(el.textContent, 11, 'normal')
    }

    doc.save('document.pdf')
  }, [])

  const exportToTxt = useCallback(() => {
    const el = editorRef.current
    if (!el || !el.textContent?.trim()) return
    const text = el.innerText || el.textContent || ''
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportToMd = useCallback(() => {
    const md = rawMarkdown.trim()
    if (!md) return
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [rawMarkdown])

  const exportToEmail = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const text = (el.innerText || el.textContent || '').trim()
    if (!text) return
    if (text.length > 2000) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Texte trop long pour l\'email — copié dans le presse-papier')
      })
      return
    }
    const subject = encodeURIComponent('Document')
    const body = encodeURIComponent(text)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }, [])

  const insertFromNodes = useCallback(() => {
    // Triggered externally via ref - just focus
    editorRef.current?.focus()
  }, [])

  // Expose insertContent for external use
  ;(TextEditorPanel as any)._insert = (html: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        const frag = range.createContextualFragment(html)
        range.deleteContents()
        range.insertNode(frag)
      } else {
        editorRef.current.innerHTML += html
      }
      handleInput()
    }
  }

  return (
    <div className="text-editor-panel">
      <div className="text-editor-header">
        <span className="text-editor-title">📝 Éditeur de document</span>
        <button className="modal-close" onClick={onClose}>&times;</button>
      </div>

      <div className="text-editor-toolbar">
        {/* Text style */}
        <select
          className="editor-select"
          onChange={(e) => exec('formatBlock', e.target.value)}
          defaultValue="p"
          title="Style"
        >
          <option value="p">Paragraphe</option>
          <option value="h1">Titre 1</option>
          <option value="h2">Titre 2</option>
          <option value="h3">Titre 3</option>
          <option value="blockquote">Citation</option>
        </select>

        {/* Font size */}
        <select
          className="editor-select editor-select-sm"
          onChange={(e) => exec('fontSize', e.target.value)}
          defaultValue="3"
          title="Taille"
        >
          {FONT_SIZES.map((size, i) => (
            <option key={size} value={String(i + 1)}>{size}px</option>
          ))}
        </select>

        <div className="editor-toolbar-separator" />

        <button className="editor-btn" onClick={() => exec('bold')} title="Gras (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button className="editor-btn editor-btn-italic" onClick={() => exec('italic')} title="Italique (Ctrl+I)">
          <em>I</em>
        </button>
        <button className="editor-btn editor-btn-underline" onClick={() => exec('underline')} title="Souligné (Ctrl+U)">
          <u>U</u>
        </button>

        <div className="editor-toolbar-separator" />

        <button className="editor-btn" onClick={() => exec('justifyLeft')} title="Aligner à gauche">⬅</button>
        <button className="editor-btn" onClick={() => exec('justifyCenter')} title="Centrer">☰</button>
        <button className="editor-btn" onClick={() => exec('justifyRight')} title="Aligner à droite">➡</button>

        <div className="editor-toolbar-separator" />

        <button className="editor-btn" onClick={() => exec('insertUnorderedList')} title="Liste à puces">•≡</button>
        <button className="editor-btn" onClick={() => exec('insertOrderedList')} title="Liste numérotée">1≡</button>

        <div className="editor-toolbar-separator" />

        <input
          type="color"
          className="editor-color-input"
          onChange={(e) => exec('foreColor', e.target.value)}
          title="Couleur du texte"
          defaultValue="#f1f5f9"
        />

        <input
          type="color"
          className="editor-color-input"
          value={bgColor}
          onChange={(e) => {
            setBgColor(e.target.value)
            if (editorRef.current) editorRef.current.style.backgroundColor = e.target.value
          }}
          title="Couleur de fond"
        />

        <div className="editor-toolbar-separator" />

        <select
          className="editor-select"
          onChange={(e) => { if (editorRef.current) editorRef.current.style.fontFamily = e.target.value }}
          defaultValue=""
          title="Police"
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <div className="editor-toolbar-separator" />

        <button className="editor-btn" onClick={() => exec('removeFormat')} title="Supprimer le formatage">✕</button>
        <button className="editor-btn" onClick={() => exec('strikeThrough')} title="Barré" style={{ textDecoration: 'line-through' }}>S</button>

        <div className="editor-toolbar-separator" />

        <div className="editor-layout-menu-wrapper">
          <button
            className="editor-btn editor-layout-btn"
            onClick={() => setShowLayoutMenu((v) => !v)}
            title="Mise en page rapide"
          >
            📄 Modèles
          </button>
          {showLayoutMenu && (
            <div className="editor-layout-menu">
              {QUICK_LAYOUTS.map((tpl) => (
                <button
                  key={tpl.label}
                  className="editor-layout-item"
                  onClick={() => {
                    if (editorRef.current) {
                      const isEmpty = !editorRef.current.textContent?.trim()
                      if (!isEmpty && !window.confirm('Remplacer le contenu actuel par ce modèle ?')) {
                        setShowLayoutMenu(false)
                        return
                      }
                      editorRef.current.innerHTML = tpl.html
                      handleInput()
                    }
                    setShowLayoutMenu(false)
                  }}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={editorRef}
        className="text-editor-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{ backgroundColor: bgColor }}
        data-placeholder="Commencez à écrire, ou générez du contenu avec Ollama..."
      />

      <div className="text-editor-footer">
        <button className="editor-clear-btn" onClick={() => { if (editorRef.current) editorRef.current.innerHTML = '' }}>
          🗑 Effacer
        </button>
        <button className="editor-export-btn editor-txt-btn" onClick={exportToTxt} title="Exporter en texte brut">
          ⬇ .txt
        </button>
        {rawMarkdown && (
          <button className="editor-export-btn editor-md-btn" onClick={exportToMd} title="Exporter le Markdown brut">
            ⬇ .md
          </button>
        )}
        <button className="editor-export-btn editor-email-btn" onClick={exportToEmail} title="Envoyer par email">
          ✉ Email
        </button>
        <button className="editor-pdf-btn" onClick={exportToPDF}>
          📄 Exporter PDF
        </button>
      </div>
    </div>
  )
}

export default TextEditorPanel
