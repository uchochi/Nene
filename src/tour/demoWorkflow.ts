import { useWorkflowStore } from '../store/workflowStore'
import type { Edge } from 'reactflow'

/**
 * Seeds a sample workflow (Input → Format → Output) onto an empty canvas
 * so the product tour can point at real nodes and connections.
 *
 * Returns the ids of the created nodes, or null when the canvas already
 * has nodes (tour replays on existing workflows don't touch anything).
 */
export function seedDemoWorkflow(): { inputId: string; formatId: string; outputId: string } | null {
  const { nodes, addNode } = useWorkflowStore.getState()
  if (nodes.length > 0) return null

  addNode('input', { x: 60, y: 180 })
  addNode('format', { x: 320, y: 180 })
  addNode('output', { x: 580, y: 180 })

  const added = useWorkflowStore.getState().nodes
  const [inputNode, formatNode, outputNode] = added
  if (!inputNode || !formatNode || !outputNode) return null

  const edges: Edge[] = [
    {
      id: `tour-${inputNode.id}-${formatNode.id}`,
      source: inputNode.id,
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
  return { inputId: inputNode.id, formatId: formatNode.id, outputId: outputNode.id }
}

/** CSS selector for a React Flow node's DOM element. */
export function nodeSelector(id: string): string {
  return `.react-flow__node[data-id="${id}"]`
}
