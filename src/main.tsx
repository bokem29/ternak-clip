import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
    console.log('Mounting React Application...');
    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error('Root element not found');

    createRoot(rootElement).render(<App />);
    console.log('React Application Mounted Successfully');
} catch (error) {
    console.error('Failed to mount React Application:', error);
    document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>Critical Error</h1><pre>${error}</pre></div>`;
}
