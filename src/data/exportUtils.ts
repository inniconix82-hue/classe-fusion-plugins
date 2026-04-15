import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { Node } from '@xyflow/react'

function getFlowViewport(): HTMLElement | null {
  return document.querySelector('.react-flow__viewport') as HTMLElement | null
}

function getFlowContainer(): HTMLElement | null {
  return document.querySelector('.react-flow') as HTMLElement | null
}

function getNodesBoundingBox(nodes: Node[]): { x: number; y: number; width: number; height: number } | null {
  if (nodes.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((node) => {
    const w = node.measured?.width ?? 180
    const h = node.measured?.height ?? 80
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + w)
    maxY = Math.max(maxY, node.position.y + h)
  })

  const padding = 60
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  }
}

async function captureCanvas(nodes?: Node[]): Promise<HTMLCanvasElement | null> {
  const viewport = getFlowViewport()
  const container = getFlowContainer()
  if (!viewport || !container) return null

  // Hide controls, minimap, and panel during capture
  const uiElements = container.querySelectorAll<HTMLElement>(
    '.react-flow__controls, .react-flow__minimap, .react-flow__panel'
  )
  uiElements.forEach((el) => (el.style.display = 'none'))

  // Get the current transform of the viewport
  const viewportStyle = window.getComputedStyle(viewport)
  const transform = viewportStyle.transform
  const originalTransform = viewport.style.transform

  // If we have nodes, compute bounding box and adjust viewport transform
  let captureWidth = container.clientWidth
  let captureHeight = container.clientHeight

  if (nodes && nodes.length > 0) {
    const bounds = getNodesBoundingBox(nodes)
    if (bounds) {
      // Calculate scale to fit bounds into a reasonable export size
      const maxDim = 2000
      const scaleX = maxDim / bounds.width
      const scaleY = maxDim / bounds.height
      const scale = Math.min(scaleX, scaleY, 2) // cap at 2x

      captureWidth = Math.ceil(bounds.width * scale)
      captureHeight = Math.ceil(bounds.height * scale)

      // Set viewport transform to center on the bounding box
      viewport.style.transform = `translate(${-bounds.x * scale}px, ${-bounds.y * scale}px) scale(${scale})`
    }
  }

  // Wait for transform to apply
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  const canvas = await html2canvas(viewport, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    logging: false,
    width: captureWidth,
    height: captureHeight,
    // Capture all content including SVG edges
    foreignObjectRendering: false,
    onclone: (clonedDoc) => {
      // Ensure SVG edges are visible in the clone
      const svgEdges = clonedDoc.querySelectorAll('.react-flow__edge path')
      svgEdges.forEach((path) => {
        const el = path as SVGPathElement
        el.setAttribute('stroke-opacity', '1')
      })
    },
  })

  // Restore original transform and UI
  viewport.style.transform = originalTransform
  uiElements.forEach((el) => (el.style.display = ''))

  return canvas
}

export async function exportToPNG(filename: string = 'organisation', nodes?: Node[]) {
  const canvas = await captureCanvas(nodes)
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportToPDF(filename: string = 'organisation', nodes?: Node[]) {
  const canvas = await captureCanvas(nodes)
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
