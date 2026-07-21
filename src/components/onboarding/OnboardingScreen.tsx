import { useWorkflowStore } from '../../store/workflowStore'
import { ArrowRight } from 'lucide-react'

export function OnboardingScreen() {
  const setShowOnboarding = useWorkflowStore(s => s.setShowOnboarding)
  const setOnboardingShown = useWorkflowStore(s => s.setOnboardingShown)

  const handleGetStarted = () => {
    setShowOnboarding(false)
    setOnboardingShown(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-n8n-dark overflow-y-auto">
      <div className="max-w-lg w-full mx-4 my-8">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/logo.png" alt="ooguy" className="w-full h-full object-contain" />
          </div>
          <p className="text-n8n-gray-light text-sm">
            Format, translate, and structure data for LLM training
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3 mb-8">
          <div className="panel p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-node-input/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📥</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Import Your Data</h3>
              <p className="text-xs text-n8n-gray-light">
                Paste raw content, JSON, or CSV. The AI analyzes and structures it automatically.
              </p>
            </div>
          </div>

          <div className="panel p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-node-format/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔧</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Build Workflows Visually</h3>
              <p className="text-xs text-n8n-gray-light">
                Drag and drop nodes to create data processing pipelines — just like n8n.
              </p>
            </div>
          </div>

          <div className="panel p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-node-ai/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">AI-Powered Analysis</h3>
              <p className="text-xs text-n8n-gray-light">
                Automatically tag, categorize, translate, and generate Chain-of-Thought explanations.
              </p>
            </div>
          </div>

          <div className="panel p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-node-output/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📤</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Export as JSONL</h3>
              <p className="text-xs text-n8n-gray-light">
                Download industry-standard JSONL files ready for fine-tuning LLMs.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="panel p-4 mb-8">
          <h3 className="text-sm font-semibold text-white mb-3">Example: Humor Dataset</h3>
          <div className="bg-n8n-dark-4 rounded-lg p-3 font-mono text-xs text-n8n-gray-light mb-3 overflow-x-auto">
            <pre>{`{
  "setup": "¿Qué hace una abeja en el gimnasio?",
  "punchline": "¡Zum-ba!",
  "humor_mechanics": ["pun", "phonetic_ambiguity"],
  "cultural_context": "Zumba is a dance fitness program",
  "explanation_for_ai": "The humor arises from..."
}`}</pre>
          </div>
          <p className="text-xs text-n8n-gray">
            Every entry includes rich metadata: language, region, humor mechanics, cultural context, and Chain-of-Thought explanations.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <button
            onClick={handleGetStarted}
            className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base"
          >
            Get Started
            <ArrowRight size={18} />
          </button>
          <p className="text-xs text-n8n-gray">
            Built for AI trainers, linguists, and dataset creators
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-n8n-dark-4">
          <p className="text-xs text-n8n-gray flex items-center justify-center gap-1">
            Inspired by
            <a
              href="https://n8n.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-n8n-orange hover:underline"
            >
              n8n.io
            </a>
            — Workflow automation for AI data
          </p>
        </div>
      </div>
    </div>
  )
}
