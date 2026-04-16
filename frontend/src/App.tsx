import React, { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './pages/HomePage';
import { VerifyPage } from './pages/VerifyPage';
import { IssuePage } from './pages/IssuePage';
import { DashboardPage } from './pages/DashboardPage';
import { RevokePage } from './pages/RevokePage';
import { DIDPage } from './pages/DIDPage';
import './styles/globals.css';
import type { PageId } from './types';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':      return <HomePage onNavigate={setCurrentPage} />;
      case 'verify':    return <VerifyPage />;
      case 'issue':     return <IssuePage />;
      case 'dashboard': return <DashboardPage onNavigate={setCurrentPage} />;
      case 'revoke':    return <RevokePage />;
      case 'did':       return <DIDPage />;
      default:          return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main>{renderPage()}</main>
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}