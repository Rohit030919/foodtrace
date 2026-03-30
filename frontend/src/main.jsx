import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Removed React.StrictMode — it runs every useEffect twice in development
// which causes a race condition in fetchData on the BatchTrackingPage,
// wiping successful state and causing a blank screen on QR scan.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
