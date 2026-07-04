import { useWorkflowStore } from '../../store/workflowStore'
import { validateJSONL, getStatistics } from '../../utils/jsonl'
import { Copy, BarChart3, X } from 'lucide-react'
import { isTMA, hapticFeedback } from '../../utils/tma'
import { useState } from 'react'

export function DatasetPreview() {
  const datasetResult = useWorkflowStore(s => s.datasetResult)
  const addToHistory = useWorkflowStore(s => s.addToHistory)
  const workflowName = useWorkflowStore(s => s.workflowName)
  const [tab, setTab] = useState<'preview' | 'stats' | 'raw'>('preview')
  const setDatasetResult = useWorkflowStore(s => s.setDatasetResult)

  if (!datasetResult) return null

  const { entries } = validateJSONL(datasetResult)
  const stats = getStatistics(entries)

  const [copyMsg, setCopyMsg] = useState<string | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(datasetResult)
      addToHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        workflowName,
        rowCount: entries.length,
        outputPreview: datasetResult.slice(0, 200),
      })
      if (isTMA()) hapticFeedback('success')
      setCopyMsg('Copied!')
    } catch {
      setCopyMsg('Failed to copy')
    }
    setTimeout(() => setCopyMsg(null), 3000)
  }

  const previewLines = datasetResult.split('\n').filter(l => l.trim()).slice(0, 5)

  return (
    <div className="panel m-3 flex flex-col max-h-[300px]">
      <div className="px-4 py-2.5 border-b border-n8n-dark-4 space-y-2 md:space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-n8n-orange" />
            <span className="text-sm font-semibold text-white">Dataset Output</span>
            <span className="text-xs text-n8n-gray-light bg-n8n-dark-4 px-2 py-0.5 rounded-full">
              {entries.length} entries
            </span>
          </div>
          <button
            onClick={() => setDatasetResult(null)}
            className="p-1 rounded-md hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-n8n-dark-4 rounded-lg p-0.5 flex-1 md:flex-none">
            <button
              onClick={() => setTab('preview')}
              className={`flex-1 md:flex-none px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === 'preview' ? 'bg-n8n-dark-3 text-white' : 'text-n8n-gray-light hover:text-white'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setTab('stats')}
              className={`flex-1 md:flex-none px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === 'stats' ? 'bg-n8n-dark-3 text-white' : 'text-n8n-gray-light hover:text-white'
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => setTab('raw')}
              className={`flex-1 md:flex-none px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === 'raw' ? 'bg-n8n-dark-3 text-white' : 'text-n8n-gray-light hover:text-white'
              }`}
            >
              Raw
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5 whitespace-nowrap"
          >
            <Copy size={14} />
            Copy
          </button>
          {copyMsg && (
            <span className="text-xs text-green-400 font-medium whitespace-nowrap">{copyMsg}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'preview' && (
          <div className="space-y-2">
            {previewLines.map((line, i) => {
              try {
                const parsed = JSON.parse(line)
                return (
                  <div key={i} className="bg-n8n-dark-4 rounded-lg p-3 font-mono text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-n8n-gray-light font-semibold">#{i + 1}</span>
                      {parsed.language_code && (
                        <span className="text-[10px] uppercase bg-n8n-dark-5 px-1.5 py-0.5 rounded text-n8n-gray-light">
                          {parsed.language_code}
                        </span>
                      )}
                      {parsed.humor_mechanics?.slice(0, 2).map((m: string) => (
                        <span key={m} className="text-[10px] bg-n8n-orange/10 text-n8n-orange px-1.5 py-0.5 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                    <div className="text-n8n-gray-light line-clamp-2">
                      {parsed.setup || parsed.raw_content || JSON.stringify(parsed).slice(0, 100)}
                    </div>
                  </div>
                )
              } catch {
                return (
                  <div key={i} className="bg-n8n-red/10 rounded-lg p-3 text-xs text-n8n-red">
                    Invalid JSON on line {i + 1}
                  </div>
                )
              }
            })}
            {previewLines.length === 0 && (
              <div className="text-center text-n8n-gray text-sm py-8">No data entries</div>
            )}
          </div>
        )}

        {tab === 'stats' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-n8n-dark-4 rounded-lg p-3">
              <div className="text-xs text-n8n-gray-light mb-1">Total Entries</div>
              <div className="text-2xl font-bold text-white">{stats.totalEntries as number}</div>
            </div>
            <div className="bg-n8n-dark-4 rounded-lg p-3">
              <div className="text-xs text-n8n-gray-light mb-1">Languages</div>
              <div className="text-2xl font-bold text-white">{stats.uniqueLanguages as number}</div>
            </div>
            <div className="bg-n8n-dark-4 rounded-lg p-3">
              <div className="text-xs text-n8n-gray-light mb-1">Regions</div>
              <div className="text-2xl font-bold text-white">{stats.uniqueRegions as number}</div>
            </div>
            <div className="bg-n8n-dark-4 rounded-lg p-3">
              <div className="text-xs text-n8n-gray-light mb-1">Mechanics</div>
              <div className="text-2xl font-bold text-white">
                {Object.keys(stats.byMechanic as Record<string, number>).length}
              </div>
            </div>
            {(Object.entries(stats.byLanguage as Record<string, number>) || []).length > 0 && (
              <div className="col-span-2 bg-n8n-dark-4 rounded-lg p-3">
                <div className="text-xs text-n8n-gray-light mb-2">By Language</div>
                {Object.entries(stats.byLanguage as Record<string, number>).map(([lang, count]) => (
                  <div key={lang} className="flex items-center justify-between text-xs text-n8n-gray-light mb-1">
                    <span className="uppercase">{lang}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'raw' && (
          <pre className="font-mono text-xs text-n8n-gray-light whitespace-pre-wrap break-all">
            {datasetResult}
          </pre>
        )}
      </div>
    </div>
  )
}
