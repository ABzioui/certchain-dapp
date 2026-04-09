import { ethers } from 'ethers';
import type { IssueCertFormData } from '../types';

/**
 * Calcule le hash SHA-256 des données d'un certificat.
 * Ce hash est stocké on-chain — les données brutes restent hors chaîne (RGPD).
 */
export async function hashCertData(data: IssueCertFormData): Promise<string> {
  const payload = JSON.stringify({
    recipientName: data.recipientName.trim(),
    recipientAddr: data.recipientAddr.trim().toLowerCase(),
    diplomaTitle:  data.diplomaTitle.trim(),
    mention:       data.mention.trim(),
    date:          data.date,
  });

  const encoded = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  const hashHex    = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return '0x' + hashHex;
}

/**
 * Tronque une adresse Ethereum pour l'affichage.
 * Ex: 0xf39F...2266
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}

/**
 * Convertit un timestamp blockchain (bigint) en date lisible.
 */
export function formatTimestamp(ts: bigint): string {
  if (!ts || ts === 0n) return '—';
  return new Date(Number(ts) * 1000).toLocaleDateString('fr-FR', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
}

/**
 * Génère l'URL de vérification d'un certificat (pour le QR Code).
 */
export function getCertVerifyUrl(certId: string): string {
  const base = window.location.origin;
  return `${base}/verify?certId=${certId}`;
}

/**
 * Formate un hash bytes32 pour l'affichage.
 */
export function formatHash(hash: string, chars = 8): string {
  if (!hash || hash === ethers.ZeroHash) return '—';
  return `${hash.slice(0, 2 + chars)}...${hash.slice(-chars)}`;
}