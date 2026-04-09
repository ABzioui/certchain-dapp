import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import deployments from '../abis/deployments.json';
import CertificateRegistryABI from '../abis/CertificateRegistry.json';
import RevocationListABI      from '../abis/RevocationList.json';
import DIDRegistryABI         from '../abis/DIDRegistry.json';
import CertNFTABI             from '../abis/CertNFT.json';

const READ_ONLY_PROVIDER = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

export function useContracts() {
  const { provider, signer } = useWallet();

  const contracts = useMemo(() => {
    const runner = signer ?? provider ?? READ_ONLY_PROVIDER;

    return {
      registry:       new ethers.Contract(deployments.CertificateRegistry, CertificateRegistryABI, runner),
      revocationList: new ethers.Contract(deployments.RevocationList,      RevocationListABI,      runner),
      didRegistry:    new ethers.Contract(deployments.DIDRegistry,         DIDRegistryABI,         runner),
      certNFT:        new ethers.Contract(deployments.CertNFT,             CertNFTABI,             runner),
    };
  }, [provider, signer]);

  return contracts;
}