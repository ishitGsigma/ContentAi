import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#040817", color: "#e2e8f0", padding: "2rem" }}>
          <div style={{ maxWidth: "680px", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(10,16,32,0.95)", borderRadius: "24px", padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <h1 style={{ marginBottom: "1rem", fontSize: "2rem" }}>Oops — Something went wrong</h1>
            <p style={{ color: "#a3bffa", marginBottom: "1.5rem" }}>
              The app failed to load. The error has been logged to the console for debugging.
            </p>
            <pre style={{ textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#cbd5e1", background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "1rem" }}>
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
