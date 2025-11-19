import React from 'react'
import ReactDOM from 'react-dom/client'
import AuthenticatedWakiliApp from './AuthenticatedWakiliApp.tsx'
import './index.css'

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '20px', fontFamily: 'sans-serif'}}>
          <h1>⚠️ Something went wrong</h1>
          <pre style={{background: '#f5f5f5', padding: '10px', overflow: 'auto'}}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthenticatedWakiliApp />
    </ErrorBoundary>
  </React.StrictMode>,
)