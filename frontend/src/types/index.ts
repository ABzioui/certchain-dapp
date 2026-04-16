// ─── Blockchain Types ─────────────────────────────────────────────────────────

export interface Certificate {
  certId:     string;
  certHash:   string;
  issuer:     string;
  issuedAt:   bigint;
  revoked:    boolean;
  nftTokenId: bigint;
  ipfsHash:   string;
}

export interface RevocationInfo {
  isRevoked:  boolean;
  revokedBy:  string;
  revokedAt:  bigint;
  reason:     string;
}

export interface DIDDocument {
  name:         string;
  ipfsDocHash:  string;
  active:       boolean;
  registeredAt: bigint;
  updatedAt:    bigint;
}

export interface CertificateStatus {
  certificate:    Certificate | null;
  revocationInfo: RevocationInfo | null;
  issuerDID:      DIDDocument | null;
  isValid:        boolean;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface IssueCertFormData {
  recipientName:  string;
  recipientAddr:  string;
  diplomaTitle:   string;
  mention:        string;
  date:           string;
  ipfsHash:       string;
}

// ─── Wallet Types ─────────────────────────────────────────────────────────────

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status:           WalletStatus;
  address:          string | null;
  chainId:          number | null;
  isCorrectNetwork: boolean;
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id:      string;
  type:    NotificationType;
  title:   string;
  message: string;
}

export type PageId = 'home' | 'verify' | 'issue' | 'revoke' | 'dashboard' | 'did';