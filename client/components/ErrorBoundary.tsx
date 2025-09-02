import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console for debugging
    console.error("🚨 ErrorBoundary caught an error:", error);
    console.error("Error info:", errorInfo);
    
    // Check for Builder.io related errors
    if (error.message && error.message.includes("Builder") || 
        error.stack && error.stack.includes("Builder")) {
      console.error("🔍 This appears to be a Builder.io related error");
    }
    
    // Check for CSS-in-JS related errors
    if (error.message && (error.message.includes("css") || error.message.includes("style"))) {
      console.error("🎨 This appears to be a CSS/styling related error");
    }

    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return <Fallback error={this.state.error} />;
      }

      // Default fallback UI
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-700 mb-4">
            An error occurred while rendering this component. This might be due to:
          </p>
          <ul className="list-disc list-inside text-red-700 mb-4 space-y-1">
            <li>Cached Builder.io content (try clearing browser cache)</li>
            <li>Malformed CSS or styling issues</li>
            <li>Network connectivity problems</li>
          </ul>
          <details className="text-sm">
            <summary className="cursor-pointer text-red-800 font-medium">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple fallback component for critical errors
export const SimpleFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
    <h3 className="font-medium text-yellow-800">Loading Error</h3>
    <p className="text-yellow-700 text-sm mt-1">
      Please refresh the page or try again later.
    </p>
    {error && (
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer">Error Details</summary>
        <pre className="mt-1 p-2 bg-yellow-100 rounded text-xs">
          {error.toString()}
        </pre>
      </details>
    )}
  </div>
);

export default ErrorBoundary;
