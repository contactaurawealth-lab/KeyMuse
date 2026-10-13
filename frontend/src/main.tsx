import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AudioStateProvider } from './context/AudioStateContext';
import './styles/theme.css';
import './styles/studio.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AudioStateProvider>
      <App />
    </AudioStateProvider>
  </React.StrictMode>
);
