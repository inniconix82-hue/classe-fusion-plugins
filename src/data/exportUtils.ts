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

  const padding = 80
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

  // Hide UI controls during capture
  const uiElements = container.querySelectorAll<HTMLElement>(
    '.react-flow__controls, .react-flow__minimap, .react-flow__panel'
  )
  uiElements.forEach((el) => (el.style.visibility = 'hidden'))

  const originalViewportTransform = viewport.style.transform
  const originalWidth = container.style.width
  const originalHeight = container.style.height
  const originalOverflow = container.style.overflow
  const originalPosition = (container.parentElement as HTMLElement)?.style.overflow

  let captureWidth = container.clientWidth
  let captureHeight = container.clientHeight

  if (nodes && nodes.length > 0) {
    const bounds = getNodesBoundingBox(nodes)
    if (bounds) {
      // Scale to get a good resolution without going too large
      const maxDim = 4000
      const scale = Math.min(maxDim / bounds.width, maxDim / bounds.height, 2)
      captureWidth = Math.ceil(bounds.width * scale)
      captureHeight = Math.ceil(bounds.height * scale)

      // Expand the container to fit all content so html2canvas doesn't clip
      container.style.width = `${captureWidth}px`
      container.style.height = `${captureHeight}px`
      container.style.overflow = 'hidden'
      if (container.parentElement) {
        (container.parentElement as HTMLElement).style.overflow = 'visible'
      }

      // Translate + scale viewport to show all nodes
      viewport.style.transform = `translate(${-bounds.x * scale}px, ${-bounds.y * scale}px) scale(${scale})`
    }
  }

  // Wait for layout to update
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  const canvas = await html2canvas(container, {
    backgroundColor: '#0f172a',
    scale: 1,
    useCORS: true,
    logging: false,
    width: captureWidth,
    height: captureHeight,
    windowWidth: captureWidth,
    windowHeight: captureHeight,
    onclone: (clonedDoc) => {
      const svgEdges = clonedDoc.querySelectorAll('.react-flow__edge path')
      svgEdges.forEach((path) => {
        ;(path as SVGPathElement).setAttribute('stroke-opacity', '1')
      })
    },
  })

  // Restore everything
  viewport.style.transform = originalViewportTransform
  container.style.width = originalWidth
  container.style.height = originalHeight
  container.style.overflow = originalOverflow
  if (container.parentElement && originalPosition !== undefined) {
    ;(container.parentElement as HTMLElement).style.overflow = originalPosition
  }
  uiElements.forEach((el) => (el.style.visibility = ''))

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

  const isLandscape = imgWidth > imgHeight
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [imgWidth, imgHeight],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  pdf.save(`${filename}.pdf`)
}
