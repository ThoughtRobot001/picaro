import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './app/App';
import LandingPage from './app/LandingPage';
import LoginPage from './app/LoginPage';
import { AppShell } from './app/AppShell';
import '../src/styles/index.css';
import '../src/styles/picaro.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<App />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  </React.StrictMode>
);
