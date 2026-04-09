import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import type { WalletState } from '../types';

// ─── Hardhat local network ────────────────────────────────────────────────────
const HARDHAT_CHAIN_ID = 31337;
const SEPOLIA_CHAIN_ID = 11155111;
const SUPPORTED_CHAINS = [HARDHAT_CHAIN_ID, SEPOLIA_CHAIN_ID];

// ─── Context Type ─────────────────────────────────────────────────────────────
interface WalletContextType {
  wallet:      WalletState;
  provider:    ethers.BrowserProvider | null;
  signer:      ethers.Signer | null;
  connect:     () => Promise<void>;
  disconnect:  () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    status:           'disconnected',
    address:          null,
    chainId:          null,
    isCorrectNetwork: false,
  });
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer,   setSigner]   = useState<ethers.Signer | null>(null);

  const updateWallet = useCallback(async (ethProvider: ethers.BrowserProvider) => {
    const accounts = await ethProvider.listAccounts();
    const network  = await ethProvider.getNetwork();
    const chainId  = Number(network.chainId);

    if (accounts.length === 0) {
      setWallet({ status: 'disconnected', address: null, chainId: null, isCorrectNetwork: false });
      setSigner(null);
      return;
    }

    const s = await ethProvider.getSigner();
    setSigner(s);
    setWallet({
      status:           'connected',
      address:          accounts[0].address,
      chainId,
      isCorrectNetwork: SUPPORTED_CHAINS.includes(chainId),
    });
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask non détecté. Veuillez installer MetaMask.');
      return;
    }

    setWallet(prev => ({ ...prev, status: 'connecting' }));
    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      await ethProvider.send('eth_requestAccounts', []);
      setProvider(ethProvider);
      await updateWallet(ethProvider);
    } catch (err) {
      setWallet(prev => ({ ...prev, status: 'error' }));
    }
  }, [updateWallet]);

  const disconnect = useCallback(() => {
    setWallet({ status: 'disconnected', address: null, chainId: null, isCorrectNetwork: false });
    setProvider(null);
    setSigner(null);
  }, []);

  // Auto-reconnect si déjà connecté
  useEffect(() => {
    if (!window.ethereum) return;

    const ethProvider = new ethers.BrowserProvider(window.ethereum);
    ethProvider.listAccounts().then(accounts => {
      if (accounts.length > 0) {
        setProvider(ethProvider);
        updateWallet(ethProvider);
      }
    });

    const handleAccountsChanged = () => updateWallet(ethProvider);
    const handleChainChanged    = () => updateWallet(ethProvider);

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged',    handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged',    handleChainChanged);
    };
  }, [updateWallet]);

  return (
    <WalletContext.Provider value={{ wallet, provider, signer, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}