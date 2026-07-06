import { useState } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import { useCreditStore } from '../../store/creditStore'
import { COST_PER_EXPORT } from '../../utils/credits'
import { encodeDownloadData } from '../../utils/downloadLink'
import { X, Copy, Share2, ExternalLink } from 'lucide-react'

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const datasetResult = useWorkflowStore(s => s.datasetResult)
  const workflowName = useWorkflowStore(s => s.workflowName)
  const addToHistory = useWorkflowStore(s => s.addToHistory)
  const deductCredits = useCreditStore(s => s.deductCredits)
  const [copyMsg, setCopyMsg] = useState('')
  const [exporting, setExporting] = useState(false)

  if (!open || !datasetResult) return null

  const filename = `${workflowName.replace(/\s+/g, '_').toLowerCase()}_dataset.jsonl`
  const downloadUrl = encodeDownloadData(datasetResult, filename)

  const rowCount = datasetResult.split('\n').filter(l => l.trim()).length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl)
      setCopyMsg('Copied!')
    } catch {
      setCopyMsg('Failed to copy')
    }
    setTimeout(() => setCopyMsg(''), 2000)
  }

  const handleShare = () => {
    const telegram = (window as any).Telegram?.WebApp
    if (navigator.share) {
      navigator.share({ url: downloadUrl }).catch(() => {})
    } else if (telegram?.openLink) {
      telegram.openLink(downloadUrl)
    } else {
      handleCopy()
    }
  }

  const handleConfirmExport = async () => {
    setExporting(true)
    await deductCredits(COST_PER_EXPORT)
    await addToHistory({
      id: Date.now().toString(),
      timestamp: Date.now(),
      workflowName,
      rowCount,
      outputPreview: datasetResult.slice(0, 200),
    })
    setExporting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-xl max-w-lg w-full p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Export Dataset</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="bg-n8n-dark-3 rounded-lg px-4 py-3 text-sm">
          <div className="text-n8n-gray-light">Filename</div>
          <div className="text-white font-medium truncate">{filename}</div>
        </div>

        <div>
          <label className="label">Download Link</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              className="input-field flex-1 text-xs font-mono truncate"
              value={downloadUrl}
              readOnly
            />
            <button
              onClick={handleCopy}
              className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap flex-shrink-0"
            >
              <Copy size={14} />
              {copyMsg || 'Copy'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-n8n-gray-light bg-n8n-dark-3 rounded-lg px-4 py-3">
          <ExternalLink size={16} className="flex-shrink-0" />
          <span>Open the link in your system browser to download the file.</span>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={handleShare}
            className="btn-secondary flex items-center gap-1.5 text-sm px-4 py-2"
          >
            <Share2 size={16} />
            Share
          </button>
          <button
            onClick={async () => {
              await handleConfirmExport()
              handleShare()
              onClose()
            }}
            disabled={exporting}
            className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2"
          >
            {exporting ? 'Processing…' : 'Open & Export'}
          </button>
        </div>
      </div>
    </div>
  )
}
