import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function getFlowViewport(): HTMLElement | null {
  return document.querySelector('.react-flow__viewport') as HTMLElement | null
}

function getFlowContainer(): HTMLElement | null {
  return document.querySelector('.react-flow') as HTMLElement | null
}

async function captureCanvas(): Promise<HTMLCanvasElement | null> {
  const viewport = getFlowViewport()
  const container = getFlowContainer()
  if (!viewport || !container) return null

  // Hide controls and minimap during capture
  const controls = container.querySelectorAll<HTMLElement>(
    '.react-flow__controls, .react-flow__minimap, .react-flow__panel'
  )
  controls.forEach((el) => (el.style.display = 'none'))

  const canvas = await html2canvas(viewport, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    logging: false,
    width: container.clientWidth,
    height: container.clientHeight,
  })

  // Restore controls
  controls.forEach((el) => (el.style.display = ''))

  return canvas
}

export async function exportToPNG(filename: string = 'organisation') {
  const canvas = await captureCanvas()
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportToPDF(filename: string = 'organisation') {
  const canvas = await captureCanvas()
  if (!canvas) return

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = canvas.width
  const imgHeight = canvas.height

  // Determine orientation
  const isLandscape = imgWidth > imgHeight
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [imgWidth, imgHeight],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  pdf.save(`${filename}.pdf`)
}
