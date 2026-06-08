import React, { useState } from 'react';
import jsPDF from 'jspdf';
import type { Software, Category, Shortcut, KeyCombo } from '../../types/shortcuts';

interface PDFGeneratorProps {
  software: Software;
  selectedCategoryId?: string | null;
  onClose: () => void;
}

export function PDFGenerator({ software, selectedCategoryId, onClose }: PDFGeneratorProps) {
  const [includeNotes, setIncludeNotes] = useState(true);
  const [columns, setColumns] = useState<2 | 3>(2);
  const [showAllCats, setShowAllCats] = useState(!selectedCategoryId);
  const [generating, setGenerating] = useState(false);

  const categoriesToExport = showAllCats
    ? software.categories
    : software.categories.filter(c => c.id === selectedCategoryId);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      try {
        generatePDF(software, categoriesToExport, { includeNotes, columns });
      } finally {
        setGenerating(false);
      }
    }, 50);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel pdf-generator" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Exporter en PDF</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="pdf-options">
          <label className="form-label">
            Contenu
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={!showAllCats}
                  onChange={() => setShowAllCats(false)}
                  disabled={!selectedCategoryId}
                />
                Catégorie sélectionnée
              </label>
              <label>
                <input
                  type="radio"
                  checked={showAllCats}
                  onChange={() => setShowAllCats(true)}
                />
                Toutes les catégories
              </label>
            </div>
          </label>

          <label className="form-label">
            Colonnes
            <div className="radio-group">
              <label>
                <input type="radio" checked={columns === 2} onChange={() => setColumns(2)} />
                2 colonnes
              </label>
              <label>
                <input type="radio" checked={columns === 3} onChange={() => setColumns(3)} />
                3 colonnes
              </label>
            </div>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={e => setIncludeNotes(e.target.checked)}
            />
            Inclure les notes
          </label>
        </div>

        <div className="pdf-preview-info">
          <p>📄 A4 — {categoriesToExport.length} catégorie(s) — {
            categoriesToExport.reduce((n, c) =>
              n + c.shortcuts.length + c.subcategories.reduce((s, sub) => s + sub.shortcuts.length, 0), 0)
          } raccourcis</p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating || categoriesToExport.length === 0}
          >
            {generating ? 'Génération…' : '⬇ Télécharger PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF engine ───────────────────────────────────────────────────────────────

interface PDFOptions {
  includeNotes: boolean;
  columns: 2 | 3;
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const HEADER_H = 22;
const COL_GAP = 6;
const ROW_H = 7;
const SUB_H = 6;
const CAT_H = 9;
const NOTE_H = 5;

function generatePDF(software: Software, categories: Category[], opts: PDFOptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const colCount = opts.columns;
  const contentW = PAGE_W - MARGIN * 2;
  const colW = (contentW - COL_GAP * (colCount - 1)) / colCount;

  // Page state
  let page = 1;
  let colIdx = 0;
  let y = MARGIN + HEADER_H;

  const colX = (i: number) => MARGIN + i * (colW + COL_GAP);
  const maxY = PAGE_H - MARGIN;

  function drawPageHeader() {
    // Background strip
    doc.setFillColor(18, 18, 28);
    doc.rect(0, 0, PAGE_W, HEADER_H, 'F');
    // App icon + name
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`${software.icon ?? ''} ${software.name} — Raccourcis Clavier`.trim(), MARGIN, 13);
    // Date
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 200);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(dateStr, PAGE_W - MARGIN - doc.getTextWidth(dateStr), 13);
    // Page number
    doc.text(`Page ${page}`, PAGE_W / 2 - 5, 13);
  }

  function addPage() {
    doc.addPage();
    page++;
    colIdx = 0;
    y = MARGIN + HEADER_H;
    drawPageHeader();
  }

  function nextColumn() {
    if (colIdx < colCount - 1) {
      colIdx++;
      y = MARGIN + HEADER_H;
    } else {
      addPage();
    }
  }

  function ensureSpace(needed: number) {
    if (y + needed > maxY) nextColumn();
  }

  function drawCategoryTitle(cat: Category) {
    ensureSpace(CAT_H + 2);
    const cx = colX(colIdx);
    doc.setFillColor(30, 30, 50);
    doc.roundedRect(cx, y, colW, CAT_H, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(140, 160, 255);
    const label = `${cat.icon ?? ''}  ${cat.name}`.trim();
    doc.text(label, cx + 3, y + CAT_H - 2.5);
    y += CAT_H + 2;
  }

  function drawSubCategoryTitle(name: string) {
    ensureSpace(SUB_H + 1);
    const cx = colX(colIdx);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bolditalic');
    doc.setTextColor(120, 130, 160);
    doc.text(name.toUpperCase(), cx + 1, y + SUB_H - 2);
    y += SUB_H;
  }

  function drawShortcut(s: Shortcut, even: boolean) {
    const lines = opts.includeNotes && s.note ? 2 : 1;
    const height = ROW_H * lines + (lines > 1 ? NOTE_H : 0);
    ensureSpace(height);

    const cx = colX(colIdx);
    if (even) {
      doc.setFillColor(24, 24, 36);
      doc.rect(cx, y, colW, ROW_H, 'F');
    }

    // Action name
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(230, 230, 240);
    const actionText = truncateText(doc, s.action, colW * 0.55);
    doc.text(actionText, cx + 2, y + ROW_H - 2.2);

    // Keys
    const keysStr = s.keys.map(comboToString).join(' / ');
    drawKeyComboText(doc, keysStr, cx + colW * 0.57, y + 1.5, colW * 0.42);

    if (opts.includeNotes && s.note) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(140, 150, 180);
      const noteText = truncateText(doc, s.note, colW - 4);
      doc.text(noteText, cx + 2, y + ROW_H + NOTE_H - 1.5);
      y += NOTE_H;
    }

    y += ROW_H;
  }

  function drawKeyComboText(doc: jsPDF, text: string, x: number, y: number, maxW: number) {
    const parts = text.split('+');
    let curX = x;
    const capH = 4.5;
    const capPad = 1.5;

    parts.forEach((part, i) => {
      const partText = part.trim();
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      const tw = doc.getTextWidth(partText);
      const capW = Math.min(tw + capPad * 2, maxW - (curX - x));
      if (curX - x + capW > maxW) return;

      // Keycap background
      doc.setFillColor(45, 45, 65);
      doc.roundedRect(curX, y, capW, capH, 1, 1, 'F');
      doc.setDrawColor(80, 80, 110);
      doc.roundedRect(curX, y, capW, capH, 1, 1, 'S');

      // Key text
      doc.setTextColor(220, 220, 255);
      doc.text(partText, curX + capPad, y + capH - 1.2);
      curX += capW + 1.5;

      if (i < parts.length - 1 && curX - x + 3 < maxW) {
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 160);
        doc.text('+', curX, y + capH - 1.2);
        curX += 3;
      }
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  drawPageHeader();

  categories.forEach(cat => {
    drawCategoryTitle(cat);

    let evenRow = false;
    cat.shortcuts.forEach(s => { drawShortcut(s, evenRow); evenRow = !evenRow; });

    cat.subcategories.forEach(sub => {
      if (sub.shortcuts.length === 0) return;
      drawSubCategoryTitle(sub.name);
      sub.shortcuts.forEach(s => { drawShortcut(s, evenRow); evenRow = !evenRow; });
    });

    y += 3; // space between categories
  });

  const filename = `${software.name.replace(/\s+/g, '_')}_raccourcis.pdf`;
  doc.save(filename);
}

function comboToString(combo: KeyCombo): string {
  return [...combo.modifiers, combo.key].join('+');
}

function truncateText(doc: jsPDF, text: string, maxW: number): string {
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + '…') > maxW) {
    t = t.slice(0, -1);
  }
  return t + '…';
}
