import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary that catches render errors.
 * Shows a fallback UI instead of a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 className="text-red-400" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">出错了</h2>
          <p className="text-sm text-surface-200 mb-4 max-w-sm">
            应用遇到了一个意外错误。请尝试刷新页面。
          </p>
          {this.state.error && (
            <p className="text-xs text-red-400 mb-4 font-mono max-w-md break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-medium
                       transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
