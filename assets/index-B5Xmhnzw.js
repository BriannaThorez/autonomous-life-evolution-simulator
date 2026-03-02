const e=`
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { VectorDB } from './data/VectorDB';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
  }
  public state: ErrorBoundaryState = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    VectorDB.hardReset();
    window.location.reload();
  };

  public render() {
    const { hasError, error } = (this as any).state;
    const { children } = (this as any).props;

    if (hasError) {
      return (
        <div style={{ padding: '2rem', background: '#1a1a1a', color: '#ff4d4d', height: '100vh', fontFamily: 'monospace' }}>
          <h1>Simulation Crashed</h1>
          <pre style={{ background: '#000', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
            {error?.toString()}
          </pre>
          <button
            onClick={this.handleReset}
            style={{ marginTop: '1rem', padding: '1rem', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            HARD RESET SIMULATION (Clears IndexedDB)
          </button>
        </div>
      );
    }

    return children;
  }
}

const EntryPoint = () => {
  const [isVDBReady, setIsVDBReady] = useState(false);
  const [savedState, setSavedState] = useState<any>(null);

  useEffect(() => {
    const launch = async () => {
      try {
        console.log("[Boot] Initializing VectorDB Persistence...");
        await VectorDB.init();
        console.log("[Boot] VectorDB initialized.");
      } catch (e) {
        console.error("[Boot] VectorDB.init() failed, proceeding without saved data:", e);
      }

      try {
        console.log("[Boot] Hydrating Simulation State...");
        const state = await VectorDB.loadSimState();
        if (state) setSavedState(state);
        console.log("[Boot] State hydrated:", state ? "found" : "empty (fresh start)");
      } catch (e) {
        console.error("[Boot] loadSimState() failed, proceeding fresh:", e);
      }

      setIsVDBReady(true);
      console.log("[Boot] System Ready.");
    };

    // Timeout fallback — if IDB is completely broken, launch anyway after 5s
    const timeout = setTimeout(() => {
      if (!isVDBReady) {
        console.warn("[Boot] Timeout reached — launching without persistence.");
        setIsVDBReady(true);
      }
    }, 5000);

    launch().finally(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, []);

  if (!isVDBReady) {
    return (
      <div style={{
        background: '#050505',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#39AEA9',
        fontFamily: 'monospace',
        letterSpacing: '0.2em',
        fontSize: '0.8rem'
      }}>
        HYDRATING BIOSPHERE_DATABASE...
      </div>
    );
  }

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(<EntryPoint />);
`;export{e as default};
