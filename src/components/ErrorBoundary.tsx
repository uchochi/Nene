import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Catches render errors and displays them visibly instead of a blank screen.
 * Without this, a crash in any child component makes the entire app go blank
 * with NO visible error — making debugging impossible in the Telegram WebView.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          margin: '16px',
          background: '#1a0a14',
          border: '1px solid #ff0c00',
          borderRadius: '12px',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#ff6421',
          overflow: 'auto',
          maxHeight: '80vh',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff0c00' }}>
            Render Error
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '8px', opacity: 0.6, fontSize: '11px' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
