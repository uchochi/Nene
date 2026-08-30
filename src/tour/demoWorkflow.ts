import { useWorkflowStore } from '../store/workflowStore'
import type { Edge } from 'reactflow'

/**
 * Seeds a sample workflow (Input → Clean → Format → Output) onto an empty canvas
 * so the product tour can point at real nodes and connections.
 *
 * Returns the ids of the created nodes, or null when the canvas already
 * has nodes (tour replays on existing workflows don't touch anything).
 */
export function seedDemoWorkflow(): { inputId: string; cleanId: string; formatId: string; outputId: string } | null {
  const { nodes, addNode } = useWorkflowStore.getState()
  if (nodes.length > 0) return null

  /* Vertical chain on narrow screens so all nodes + connections stay visible;
     horizontal on desktop. Matches the palette's top-to-bottom order. */
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (isMobile) {
    addNode('input', { x: 40, y: 30 })
    addNode('clean', { x: 40, y: 210 })
    addNode('format', { x: 40, y: 390 })
    addNode('output', { x: 40, y: 570 })
  } else {
    addNode('input', { x: 60, y: 180 })
    addNode('clean', { x: 320, y: 180 })
    addNode('format', { x: 580, y: 180 })
    addNode('output', { x: 840, y: 180 })
  }

  const added = useWorkflowStore.getState().nodes
  const [inputNode, cleanNode, formatNode, outputNode] = added
  if (!inputNode || !cleanNode || !formatNode || !outputNode) return null

  const edges: Edge[] = [
    {
      id: `tour-${inputNode.id}-${cleanNode.id}`,
      source: inputNode.id,
      target: cleanNode.id,
      animated: true,
    },
    {
      id: `tour-${cleanNode.id}-${formatNode.id}`,
      source: cleanNode.id,
      target: formatNode.id,
      animated: true,
    },
    {
      id: `tour-${formatNode.id}-${outputNode.id}`,
      source: formatNode.id,
      target: outputNode.id,
      animated: true,
    },
  ]

  useWorkflowStore.setState({ edges, isDirty: true })
  return { inputId: inputNode.id, cleanId: cleanNode.id, formatId: formatNode.id, outputId: outputNode.id }
}

/** CSS selector for a React Flow node's DOM element. */
export function nodeSelector(id: string): string {
  return `.react-flow__node[data-id="${id}"]`
}
