import React, { useRef, useCallback, useEffect } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface TextEditorPanelProps {
  onClose: () => void
  initialContent?: string
  onContentChange?: (html: string) => void
}

const FONT_SIZES = ['10', '12', '14', '16', '18', '24', '32', '48']

const TextEditorPanel: React.FC<TextEditorPanelProps> = ({
  onClose,
  initialContent = '',
  onContentChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent
    }
  }, [])

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

  const exportToPDF = useCallback(async () => {
    const el = editorRef.current
    if (!el) return

    // Temporarily switch to white background + black text for PDF
    const origBg = el.style.background
    const origColor = el.style.color
    el.style.background = '#ffffff'
    el.style.color = '#000000'

    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })

    // Restore original styles
    el.style.background = origBg
    el.style.color = origColor

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15

    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let y = margin
    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
    } else {
      // Multi-page
      const ratio = canvas.width / imgWidth
      let srcY = 0
      const pageImgHeight = (pageHeight - margin * 2) * ratio

      while (srcY < canvas.height) {
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = Math.min(pageImgHeight, canvas.height - srcY)
        const ctx = pageCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(canvas, 0, srcY, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height)
        }
        const pageData = pageCanvas.toDataURL('image/png')
        const ph = (pageCanvas.height / ratio)
        pdf.addImage(pageData, 'PNG', margin, margin, imgWidth, ph)
        srcY += pageImgHeight
        if (srcY < canvas.height) pdf.addPage()
      }
    }

    pdf.save('document.pdf')
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
