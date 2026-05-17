import React, { Component } from 'react';

interface Props { children: React.ReactNode; label?: string }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', minHeight: 200, padding: 32, textAlign: 'center',
          color: '#f0e8d8', background: '#141418', borderRadius: 16,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔥</div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 8, color: '#c8a96e' }}>
            Algo deu errado
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(240,232,216,0.6)', marginBottom: 24 }}>
            {this.props.label ?? 'Um erro inesperado ocorreu nesta seção.'}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(240,232,216,0.3)', marginBottom: 20, fontFamily: 'monospace' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: 'rgba(200,169,110,0.15)', border: '1px solid rgba(200,169,110,0.3)',
              color: '#c8a96e', padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, fontFamily: "'Inter', sans-serif",
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
