
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#1a1a1a', color: '#ff4d4d', height: '100vh', fontFamily: 'monospace' }}>
          <h1>Simulation Crashed</h1>
          <pre style={{ background: '#000', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={this.handleReset}
            style={{ marginTop: '1rem', padding: '1rem', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            HARD RESET SIMULATION (Clears Data)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
