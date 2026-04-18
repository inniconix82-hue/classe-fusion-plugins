import React, { useRef, useCallback, useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import { marked } from 'marked'

interface TextEditorPanelProps {
  onClose: () => void
  initialContent?: string
  onContentChange?: (html: string) => void
}

const FONT_SIZES = ['10', '12', '14', '16', '18', '24', '32', '48']
const FONTS = [
  { label: 'Défaut', value: '' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Segoe UI', value: "'Segoe UI', sans-serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
]

const TextEditorPanel: React.FC<TextEditorPanelProps> = ({
  onClose,
  initialContent = '',
  onContentChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [bgColor, setBgColor] = useState('#1a2744')

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
        <button className="editor-pdf-btn" onClick={exportToPDF}>
          📄 Exporter PDF
        </button>
      </div>
    </div>
  )
}

export default TextEditorPanel
