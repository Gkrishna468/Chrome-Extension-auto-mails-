import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const init = () => {
    // Only inject once
    if (document.getElementById('hirenest-sidebar')) return;

    // Create container
    const sidebar = document.createElement("div");
    sidebar.id = "hirenest-sidebar";
    
    // Inject CSS directly in the page (Vite handles css if we configure manifest correctly, 
    // but just in case, we also assign classes).
    sidebar.className = "hirenest-sidebar-container";
    
    // Inline styles as fallback/guarantee for the absolute container
    Object.assign(sidebar.style, {
        position: 'fixed',
        top: '0',
        right: '0',
        width: '420px',
        height: '100vh',
        background: 'white',
        zIndex: '999999',
        boxShadow: '-2px 0 10px rgba(0,0,0,.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    });

    document.body.appendChild(sidebar);

    createRoot(sidebar).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

// Start observation or just run
init();
