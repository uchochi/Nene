import { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkflowStore } from '../../store/workflowStore'
import CustomNode from '../nodes/CustomNode'
import { isTMA } from '../../utils/tma'

const nodeTypes = { customNode: CustomNode }

export function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)

  const nodes = useWorkflowStore(s => s.nodes)
  const edges = useWorkflowStore(s => s.edges)
  const onNodesChange = useWorkflowStore(s => s.onNodesChange)
  const onEdgesChange = useWorkflowStore(s => s.onEdgesChange)
  const onConnect = useWorkflowStore(s => s.onConnect)
  const selectNode = useWorkflowStore(s => s.selectNode)

  const onNodeClick = useCallback((_: unknown, node: { id: string }) => {
    selectNode(node.id)
    if (isTMA()) {
      try {
        const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
        const hf = tg?.HapticFeedback as Record<string, unknown> | undefined
        const fn = hf?.selectionChanged as (() => void) | undefined
        fn?.()
      } catch { /* ignore */ }
    }
  }, [selectNode])

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow')
      if (!type || !rfInstance) return

      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const { addNode } = useWorkflowStore.getState()
      addNode(type as never, position)
    },
    [rfInstance]
  )

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        className="bg-n8n-dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#272333"
        />
        <Controls
          className="!bg-n8n-dark-3 !border-n8n-dark-4"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={() => '#ff6421'}
          maskColor="#0e0918"
          className="!bg-n8n-dark-3 !border-n8n-dark-4"
        />
      </ReactFlow>
    </div>
  )
}
