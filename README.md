# CertChain DApp

> Application décentralisée de preuve d'authenticité de diplômes et certificats.
> Basée sur la blockchain Ethereum — Vérification via DID & QR Code.

---

## État d'avancement

| Phase | Description | Statut |
|---|---|---|
| **Phase 1** | Conception architecture & Smart Contracts (Solidity) | ✅ 100% terminé |
| **Phase 2** | Frontend React.js & intégration Ethers.js | ✅ 100% terminé |
| Phase 3 | Module QR Code, NFT ERC-721 & DID | ✅ 100% terminé |
| Phase 4 | Tests unitaires, débogage & déploiement réseau de test | 🔜 À venir |
| Phase 5 | Documentation & préparation de la soutenance | 🔜 À venir |

---

## Guide de démarrage — Pour mon binôme

> Cette section explique comment installer et lancer le projet depuis zéro sur un nouveau PC.
> Il y a deux parties : **l'installation (une seule fois)** et **le lancement (à chaque session)**.

---

### Prérequis logiciels

Avant de commencer, installe ces outils si tu ne les as pas déjà :

| Outil | Lien | Pourquoi |
|---|---|---|
| Node.js 22+ LTS | https://nodejs.org | Runtime JavaScript |
| Git | https://git-scm.com | Cloner le projet |
| VS Code | https://code.visualstudio.com | Éditeur de code |
| MetaMask | https://metamask.io | Wallet Ethereum (extension Chrome) |

---

### INSTALLATION — À faire une seule fois

#### Étape 1 — Cloner le projet

```powershell
git clone <url-du-repo>
cd certchain-dapp
```

---

#### Étape 2 — Installer les dépendances du blockchain

```powershell
cd blockchain
npm install
```

Vérifie que ça compile :

```powershell
npx hardhat compile
```

Résultat attendu :
```
Compiled 4 Solidity files successfully
```

---

#### Étape 3 — Installer les dépendances du frontend

```powershell
cd ../frontend
npm install
```

---

#### Étape 4 — Installer MetaMask dans Chrome

1. Va sur **https://metamask.io** et clique **"Download"**
2. Installe l'extension Chrome
3. Crée un nouveau wallet (garde bien ta phrase secrète de côté)
4. Une fois installé, tu verras l'icône 🦊 en haut à droite de Chrome

---

#### Étape 5 — Ajouter le réseau Hardhat Local dans MetaMask

C'est le réseau blockchain local sur lequel tourne le projet en développement.

1. Clique sur 🦊 MetaMask
2. Clique sur le nom du réseau en haut (ex: **"Ethereum Mainnet"**)
3. Clique **"Ajouter un réseau"**
4. Clique **"Ajouter un réseau manuellement"** en bas de page
5. Remplis exactement :

```
Nom du réseau  :  Hardhat Local
URL RPC        :  http://127.0.0.1:8545
ID de chaîne   :  31337
Symbole        :  ETH
```

6. Clique **Enregistrer** puis **"Passer sur Hardhat Local"**

---

#### Étape 6 — Importer le compte de test dans MetaMask

Ce compte est fourni automatiquement par Hardhat. Il contient 10 000 ETH fictifs pour les tests.

1. Dans MetaMask, clique sur l'icône de compte en haut à droite
2. Clique **"Ajouter un compte ou du matériel"**
3. Clique **"Importer un compte"**
4. Colle cette clé privée :

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

5. Clique **Importer**

Tu devrais voir **10 000 ETH** sur ce compte.

> ⚠️ Cette clé privée est publique et connue de tous les développeurs Hardhat. Elle est uniquement utilisée pour les tests locaux. Ne jamais l'utiliser sur un vrai réseau Ethereum.

---

### LANCEMENT — À faire à chaque session de travail

À chaque fois que tu veux travailler sur le projet, tu dois ouvrir **3 terminaux** dans l'ordre suivant.

---

#### Terminal 1 — Lancer le nœud blockchain local

```powershell
cd certchain-dapp/blockchain
npx hardhat node
```

**Garde ce terminal ouvert en permanence.** Il simule la blockchain Ethereum en local. Si tu le fermes, toutes les données sont perdues et il faudra redéployer.

Tu verras s'afficher une liste de comptes de test avec leurs clés privées — c'est normal.

---

#### Terminal 2 — Déployer les contrats et accréditer

```powershell
cd certchain-dapp/blockchain
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/accredit.ts --network localhost
```

Le premier script déploie les 4 Smart Contracts sur le nœud local et génère un fichier `deployments.json` avec leurs adresses.

Le deuxième script accrédite le compte de test comme établissement émetteur autorisé, et enregistre son identité DID.

**Important :** après chaque déploiement, les adresses des contrats changent. Il faut copier les nouvelles adresses dans le frontend. Ouvre `blockchain/deployments.json` et copie son contenu dans `frontend/src/abis/deployments.json`.

Résultat attendu :
```
✅ CertificateRegistry : 0x...
✅ RevocationList      : 0x...
✅ DIDRegistry         : 0x...
✅ CertNFT             : 0x...
✅ Établissement accrédité !
✅ DID enregistré pour l'émetteur !
```

---

#### Terminal 3 — Lancer le frontend

```powershell
cd certchain-dapp/frontend
npm run dev
```

Ouvre **http://localhost:5173** dans Chrome.

---

#### Dans MetaMask

- Vérifie que le réseau sélectionné est bien **Hardhat Local**
- Vérifie que le compte actif est bien le compte importé (celui avec 10 000 ETH)
- Sur le site, clique **"Connecter Wallet"** — MetaMask te demandera de confirmer

---

### Fonctionnalités disponibles

| Page | Accès | Ce que ça fait |
|---|---|---|
| **Accueil** | Public | Présentation du projet |
| **Vérifier** | Public (sans wallet) | Vérifier l'authenticité d'un certificat via son CertID |
| **Émettre** | Wallet requis + accrédité | Créer un nouveau certificat on-chain |
| **Tableau de bord** | Wallet requis | Voir tous les certificats émis par ton compte |
| **Révoquer** | Wallet requis + émetteur | Révoquer définitivement un certificat |

---

### Flow de démonstration complet

Voici comment tester toutes les fonctionnalités une fois le projet lancé :

**1. Émettre un certificat**
- Va sur **"Émettre"**
- Remplis : Nom = "Alice Martin", Diplôme = "Master Informatique", Mention = "Très Bien", Date = 2024-06-15
- Clique "Émettre le certificat" → Confirme dans MetaMask
- Copie l'URL de vérification générée

**2. Vérifier le certificat**
- Va sur **"Vérifier"**
- Colle le CertID ou utilise l'URL copiée
- Tu verras : statut VALIDE, données on-chain, DID de l'émetteur

**3. Voir le tableau de bord**
- Va sur **"Tableau de bord"**
- Tu vois la liste de tous les certificats émis avec leurs statuts

**4. Révoquer un certificat**
- Va sur **"Révoquer"**
- Colle le CertID
- Coche la confirmation et clique "Révoquer définitivement" → Confirme dans MetaMask
- Revérifie le certificat → il affiche maintenant "RÉVOQUÉ"

---

## Phase 1 — Conception de l'Architecture & Smart Contracts

### Contexte

La Phase 1 constitue le socle technique du projet. Elle couvre la conception de l'architecture on-chain, l'écriture des 4 Smart Contracts en Solidity, la mise en place de l'environnement de développement Hardhat 3, et la validation complète par 56 tests unitaires et d'intégration.

---

### 1.1 Environnement de développement

| Outil | Version | Rôle |
|---|---|---|
| Node.js | 24.x | Runtime JavaScript |
| Hardhat | 3.3.0 | Framework de développement Solidity |
| Solidity | 0.8.26 | Langage des Smart Contracts |
| OpenZeppelin | 5.x | Bibliothèque de contrats sécurisés (ERC-721, Ownable) |
| Ethers.js | 6.x | Interaction avec la blockchain |
| Mocha + Chai | 11.x / 6.x | Framework de tests |
| TypeScript | 5.8 | Typage statique |

**Points d'attention Hardhat 3 :**

Hardhat 3 est un projet ESM pur. Il utilise `defineConfig` et un système de plugins. Dans les tests et scripts, on n'importe pas `ethers` depuis `hardhat` mais on utilise `await network.connect()` :

```typescript
// ✅ Hardhat 3
import { network } from "hardhat";
const { ethers } = await network.connect();
```

---

### 1.2 Architecture des Smart Contracts

Le système repose sur 4 contrats indépendants :

```
┌─────────────────────────────────────────────────────────────┐
│                    CERTCHAIN — ON-CHAIN                      │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  CertificateRegistry │    │      RevocationList       │   │
│  │  (contrat principal) │    │   (révocation externe)   │   │
│  │  - issueCertificate  │    │  - revoke(certId, motif) │   │
│  │  - getCertificate    │    │  - isRevoked(certId)     │   │
│  │  - revokeCertificate │    │  - getRevocationInfo     │   │
│  │  - linkNFT           │    │                          │   │
│  └──────────┬───────────┘    └──────────────────────────┘   │
│             │ certId                                         │
│             ▼                                               │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │       CertNFT        │    │       DIDRegistry         │   │
│  │    (ERC-721 badge)   │    │  (identités on-chain)    │   │
│  │  - mintCertNFT       │    │  - registerDID           │   │
│  │  - tokenURI          │    │  - resolveDID            │   │
│  │  - getCertId         │    │  - getDIDUri             │   │
│  └──────────────────────┘    └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.3 CertificateRegistry.sol — Contrat Principal

Registre central de tous les certificats. Stocke un hash SHA-256 des données (pas les données brutes, pour respecter le RGPD) ainsi que l'adresse émetteur, le timestamp, le statut de révocation et le lien IPFS.

```solidity
certId = keccak256(abi.encodePacked(certHash, msg.sender, block.timestamp));
```

Le certId est unique par combinaison (contenu + émetteur + moment). Il sert d'identifiant universel encodé dans le QR Code.

---

### 1.4 RevocationList.sol — Révocation Externe

Registre de révocation pour les tiers autorisés (ministère, organisme d'accréditation) qui ne sont pas l'émetteur original. Le frontend interroge les deux contrats pour déterminer le statut final :

```
statut_final = registry.revoked  OR  revocationList.isRevoked(certId)
```

---

### 1.5 DIDRegistry.sol — Identifiants Décentralisés

Associe une identité lisible à une adresse Ethereum via le standard DID :

```
did:ethr:0x<adresse_ethereum>
```

Même si l'établissement ferme, son identité reste résolvable sur la blockchain.

---

### 1.6 CertNFT.sol — Badge NFT ERC-721

Minte un token NFT unique par certificat, assigné au diplômé. Représentation visuelle et portable du diplôme, affichable dans MetaMask ou sur OpenSea.

---

### 1.7 Tests — 56 passants

```
npx hardhat test  →  56 passing (1s)
```

| Fichier | Tests | Couverture |
|---|---|---|
| CertificateRegistry.test.ts | 13 | Accréditation, émission, révocation, lecture |
| CertNFT.test.ts | 16 | Minting, métadonnées, contrôle d'accès |
| DIDRegistry.test.ts | 11 | Enregistrement, désactivation, résolution |
| RevocationList.test.ts | 12 | Revokers, révocation, double révocation |
| Integration.test.ts | 4 | Flow complet émission → NFT → vérification |

---

### 1.8 Structure des fichiers (blockchain/)

```
blockchain/
├── contracts/
│   ├── CertificateRegistry.sol
│   ├── RevocationList.sol
│   ├── DIDRegistry.sol
│   └── CertNFT.sol
├── scripts/
│   ├── deploy.ts       ← Déploiement des 4 contrats
│   └── accredit.ts     ← Accréditation du compte de test
├── test/
│   ├── CertificateRegistry.test.ts
│   ├── RevocationList.test.ts
│   ├── DIDRegistry.test.ts
│   ├── CertNFT.test.ts
│   └── Integration.test.ts
├── deployments.json    ← Adresses générées après déploiement
├── hardhat.config.ts
├── package.json
└── tsconfig.json
```

---

## Phase 2 — Frontend React.js & Intégration Ethers.js

### Contexte

La Phase 2 construit l'interface utilisateur complète connectée aux Smart Contracts. Le frontend est conçu avec une direction artistique **Luxury Dark** — fond noir profond, typographie Cormorant Garamond, palette or et cyan, animations fluides.

---

### 2.1 Stack Frontend

| Outil | Version | Rôle |
|---|---|---|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Typage statique |
| Vite | 5.x | Bundler et serveur de développement |
| Ethers.js | 6.x | Communication avec la blockchain |
| MetaMask | Extension | Wallet et signature des transactions |

---

### 2.2 Architecture Frontend

Le projet suit une **clean architecture** avec séparation stricte des responsabilités :

```
frontend/src/
├── abis/               ← ABIs JSON des contrats + adresses de déploiement
├── components/
│   ├── layout/         ← Navbar
│   └── ui/             ← Button, Card, Input, Badge (composants réutilisables)
├── context/            ← WalletContext (état global MetaMask)
├── hooks/              ← Logique blockchain (useVerify, useIssue, useRevoke, useDashboard)
├── pages/              ← Pages complètes (Home, Verify, Issue, Dashboard, Revoke)
├── styles/             ← Variables CSS globales et thème
├── types/              ← Types TypeScript partagés
└── utils/              ← Fonctions utilitaires (hash SHA-256, formatage adresses)
```

**Principe de séparation :** les composants UI ne touchent jamais directement Ethers.js. Toute la logique blockchain passe par les hooks custom.

---

### 2.3 Pages réalisées

**Accueil** — Page hero avec présentation du projet, aperçu animé d'un certificat, statistiques et call-to-action.

**Vérifier** — Saisie d'un CertID ou lecture depuis l'URL (QR Code ready). Interroge simultanément `CertificateRegistry` et `RevocationList` pour le statut final. Affiche les données du certificat et le DID de l'établissement émetteur. Fonctionne sans wallet (lecture seule).

**Émettre** — Formulaire complet avec aperçu en temps réel du certificat. Calcule le hash SHA-256 des données côté client, envoie uniquement le hash on-chain (conformité RGPD). Affiche l'URL de vérification après émission.

**Tableau de bord** — Récupère tous les events `CertificateIssued` émis par le wallet connecté via `queryFilter`. Affiche les statistiques (total, valides, révoqués) et la liste complète avec actions.

**Révoquer** — Recherche un certificat par CertID, vérifie que l'utilisateur est bien l'émetteur, demande une confirmation explicite avant d'envoyer la transaction de révocation.

---

### 2.4 Connexion MetaMask — WalletContext

Le contexte global gère l'état du wallet et s'abonne aux events MetaMask pour détecter les changements de compte ou de réseau en temps réel.

```typescript
// Connexion
const ethProvider = new ethers.BrowserProvider(window.ethereum);
await ethProvider.send('eth_requestAccounts', []);

// Lecture seule sans wallet (pour la vérification publique)
const READ_ONLY_PROVIDER = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
```

---

### 2.5 Structure des fichiers (frontend/src/)

```
frontend/src/
├── abis/
│   ├── deployments.json          ← Adresses des contrats (à mettre à jour après chaque déploiement)
│   ├── CertificateRegistry.json  ← ABI
│   ├── RevocationList.json       ← ABI
│   ├── DIDRegistry.json          ← ABI
│   └── CertNFT.json              ← ABI
├── components/
│   ├── layout/
│   │   └── Navbar.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Badge.tsx
├── context/
│   └── WalletContext.tsx
├── hooks/
│   ├── useContracts.ts    ← Instanciation des 4 contrats Ethers.js
│   ├── useVerify.ts       ← Vérification d'un certificat
│   ├── useIssue.ts        ← Émission d'un certificat
│   ├── useRevoke.ts       ← Révocation d'un certificat
│   └── useDashboard.ts    ← Historique des certificats émis
├── pages/
│   ├── HomePage.tsx
│   ├── VerifyPage.tsx
│   ├── IssuePage.tsx
│   ├── DashboardPage.tsx
│   └── RevokePage.tsx
├── styles/
│   └── globals.css        ← Tokens de design, thème luxury dark
├── types/
│   └── index.ts
└── utils/
    └── crypto.ts          ← hashCertData, truncateAddress, formatTimestamp
```

---

### Commandes utiles

```powershell
# Lancer le nœud blockchain local
npx hardhat node

# Déployer les contrats
npx hardhat run scripts/deploy.ts --network localhost

# Accréditer le compte de test
npx hardhat run scripts/accredit.ts --network localhost

# Lancer les tests
npx hardhat test

# Lancer le frontend
npm run dev
```

---

## Phase 3 — PDF certifié avec QR Code & vérification par import

### Contexte
La Phase 3 enrichit la DApp avec un certificat PDF téléchargeable intégrant un QR Code de vérification, ainsi que la possibilité d’importer directement ce PDF pour en vérifier l’authenticité.

### Fonctionnalités ajoutées
- génération d’un PDF certifié téléchargeable
- intégration du QR Code dans le PDF
- bouton de téléchargement après émission
- import du PDF dans la page Vérifier
- extraction automatique du QR depuis le PDF
- vérification automatique du certificat depuis le PDF importé

### Dépendances frontend à installer
```bash
npm install qrcode.react pdf-lib qrcode pdfjs-dist jsqr
```

---

*README maintenu — CertChain DApp v1.3 — Avril 2026*