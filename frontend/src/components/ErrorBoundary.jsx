import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, background: '#1a1a1a', color: '#ff5555', height: '100vh', overflow: 'auto' }}>
                    <h1>🛑 Something went wrong.</h1>
                    <h3 style={{ color: '#fff' }}>{this.state.error && this.state.error.toString()}</h3>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: 10, color: '#aaa' }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        style={{
                            marginTop: 20,
                            padding: '10px 20px',
                            background: '#ff5555',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        ⚠️ HARD RESET (Clear Data & Reload)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
