import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary for widgets and dynamic components so that an internal failure
 * never blocks or crashes the rest of the application / homepage.
 */
export default class WidgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Widget error captured by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="p-3 m-2 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {this.props.name ? `${this.props.name} ஏற்ற முடியவில்லை` : 'விட்ஜெட் ஏற்ற முடியவில்லை'} (Widget error)
            </span>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>மீண்டும் முயல்க</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
