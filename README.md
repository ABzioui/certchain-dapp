# CertChain DApp

> Application décentralisée de preuve d'authenticité de diplômes et certificats.
> Basée sur la blockchain Ethereum — Vérification via DID & QR Code.

---

## État d'avancement

| Phase | Description | Statut | % |
|---|---|---|---|
| **Phase 1** | Conception architecture & Smart Contracts (Solidity) | ✅ Terminé | 100% |
| **Phase 2** | Frontend React.js & intégration Ethers.js | ✅ Terminé | 100% |
| **Phase 3** | Module QR Code, NFT ERC-721 & DID | ✅ Terminé | 100% |
| **Phase 4** | Déploiement réseau de test Sepolia | ⚠️ Bloqué | 40% |
| **Phase 5** | Documentation & préparation de la soutenance | 🔜 À venir | 30% |

---

## Guide de démarrage — Pour mon binôme

> Cette section explique comment installer et lancer le projet depuis zéro sur un nouveau PC.
> Il y a deux parties : **l'installation (une seule fois)** et **le lancement (à chaque session)**.

---

### Prérequis logiciels

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

#### Étape 2 — Installer les dépendances blockchain

```powershell
cd blockchain
npm install
npx hardhat compile
```

Résultat attendu : `Compiled 4 Solidity files successfully`

#### Étape 3 — Installer les dépendances frontend

```powershell
cd ../frontend
npm install
```

#### Étape 4 — Installer MetaMask dans Chrome

1. Va sur **https://metamask.io** → installe l'extension Chrome
2. Crée un nouveau wallet

#### Étape 5 — Ajouter le réseau Hardhat Local dans MetaMask

1. Clique sur 🦊 MetaMask → nom du réseau → **"Ajouter un réseau"**
2. **"Ajouter un réseau manuellement"**
3. Remplis :

```
Nom du réseau  :  Hardhat Local
URL RPC        :  http://127.0.0.1:8545
ID de chaîne   :  31337
Symbole        :  ETH
```

#### Étape 6 — Importer le compte de test dans MetaMask

1. MetaMask → icône compte → **"Importer un compte"**
2. Colle cette clé privée :

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

> ⚠️ Clé publique Hardhat — uniquement pour les tests locaux. Ne jamais utiliser sur mainnet.

---

### LANCEMENT — À faire à chaque session de travail

#### Terminal 1 — Lancer le nœud blockchain local

```powershell
cd certchain-dapp/blockchain
npx hardhat node
```

**Garde ce terminal ouvert en permanence.**

#### Terminal 2 — Déployer les contrats et accréditer

```powershell
cd certchain-dapp/blockchain
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/accredit.ts --network localhost
```

Le script `deploy.ts` met à jour automatiquement `frontend/src/abis/deployments.json`.

Résultat attendu :
```
✅ CertificateRegistry : 0x...
✅ RevocationList      : 0x...
✅ DIDRegistry         : 0x...
✅ CertNFT             : 0x...
✅ Établissement accrédité !
✅ DID enregistré pour l'émetteur !
```

#### Terminal 3 — Lancer le frontend

```powershell
cd certchain-dapp/frontend
npm run dev
```

Ouvre **http://localhost:5173** dans Chrome.

#### Dans MetaMask

- Réseau : **Hardhat Local**
- Compte : celui importé avec 10 000 ETH
- Clique **"Connecter Wallet"** sur le site

---

### Fonctionnalités disponibles

| Page | Accès | Ce que ça fait |
|---|---|---|
| **Accueil** | Public | Présentation du projet |
| **Vérifier** | Public | Vérifier un certificat via CertID ou import PDF |
| **Émettre** | Wallet + accrédité | Créer un certificat on-chain + mint NFT + QR Code + PDF |
| **Tableau de bord** | Wallet | Historique des certificats émis |
| **Révoquer** | Wallet + émetteur | Révoquer définitivement un certificat |
| **Mon DID** | Wallet | Gérer son identité décentralisée |

---

### Flow de démonstration complet

**1. Émettre un certificat**
- Page **"Émettre"** → remplis le formulaire avec l'adresse Ethereum du diplômé
- Confirme dans MetaMask → écran de succès avec QR Code
- Clique **"⬡ Minter le badge NFT"** → confirme MetaMask → NFT #X lié au certificat
- Clique **"Télécharger le PDF certifié"** → PDF avec QR Code intégré

**2. Vérifier via CertID**
- Page **"Vérifier"** → colle le CertID
- Affiche : statut VALIDE, données complètes, DID émetteur, NFT token

**3. Vérifier via PDF**
- Page **"Vérifier"** → **"📄 Choisir un PDF"** → importe le PDF téléchargé
- Le QR Code est extrait automatiquement et la vérification se lance

**4. Gérer son DID**
- Page **"Mon DID"** → voir/modifier son identité décentralisée
- Le nom de l'établissement apparaît dans toutes les vérifications

**5. Révoquer un certificat**
- Page **"Révoquer"** → colle le CertID → confirme → statut passe à RÉVOQUÉ

---

## Phase 1 — Conception de l'Architecture & Smart Contracts

### Contexte

Socle technique du projet. 4 Smart Contracts en Solidity, environnement Hardhat 3, 56 tests unitaires et d'intégration.

### 1.1 Environnement de développement

| Outil | Version | Rôle |
|---|---|---|
| Node.js | 24.x | Runtime JavaScript |
| Hardhat | 3.3.0 | Framework de développement Solidity |
| Solidity | 0.8.26 | Langage des Smart Contracts |
| OpenZeppelin | 5.x | Bibliothèque ERC-721, Ownable |
| Ethers.js | 6.x | Interaction blockchain |
| Mocha + Chai | 11.x / 6.x | Tests |
| TypeScript | 5.8 | Typage statique |

### 1.2 Architecture des Smart Contracts

```
┌─────────────────────────────────────────────────────────────┐
│                    CERTCHAIN — ON-CHAIN                      │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  CertificateRegistry │    │      RevocationList       │   │
│  │  - issueCertificate  │    │  - revoke(certId, motif) │   │
│  │  - getCertificate    │    │  - isRevoked(certId)     │   │
│  │  - revokeCertificate │    │  - getRevocationInfo     │   │
│  │  - linkNFT           │    │                          │   │
│  └──────────┬───────────┘    └──────────────────────────┘   │
│             ▼                                               │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │       CertNFT        │    │       DIDRegistry         │   │
│  │  - mintCertNFT       │    │  - registerDID           │   │
│  │  - tokenURI          │    │  - resolveDID            │   │
│  │  - getCertId         │    │  - getDIDUri             │   │
│  └──────────────────────┘    └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Tests — 56 passants

```
npx hardhat test  →  56 passing (1s)
```

| Fichier | Tests |
|---|---|
| CertificateRegistry.test.ts | 13 |
| CertNFT.test.ts | 16 |
| DIDRegistry.test.ts | 11 |
| RevocationList.test.ts | 12 |
| Integration.test.ts | 4 |

### 1.4 Structure blockchain/

```
blockchain/
├── contracts/
│   ├── CertificateRegistry.sol
│   ├── RevocationList.sol
│   ├── DIDRegistry.sol
│   └── CertNFT.sol
├── scripts/
│   ├── deploy.ts       ← Déploiement + copie auto dans frontend
│   └── accredit.ts     ← Accréditation + DID du compte de test
├── test/
│   ├── CertificateRegistry.test.ts
│   ├── RevocationList.test.ts
│   ├── DIDRegistry.test.ts
│   ├── CertNFT.test.ts
│   └── Integration.test.ts
├── deployments.json
├── hardhat.config.ts
└── .env               ← PRIVATE_KEY + SEPOLIA_RPC_URL (ne pas committer)
```

---

## Phase 2 — Frontend React.js & Intégration Ethers.js

### Contexte

Interface utilisateur complète connectée aux Smart Contracts. Direction artistique **Luxury Dark** — fond noir, typographie Cormorant Garamond, palette or et cyan.

### 2.1 Stack Frontend

| Outil | Version | Rôle |
|---|---|---|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Typage statique |
| Vite | 5.x | Bundler |
| Ethers.js | 6.x | Communication blockchain |
| MetaMask | Extension | Wallet et signature |

### 2.2 Architecture Frontend — Clean Architecture

```
frontend/src/
├── abis/          ← ABIs JSON + adresses de déploiement
├── components/
│   ├── layout/    ← Navbar
│   └── ui/        ← Button, Card, Input, Badge
├── context/       ← WalletContext (état global MetaMask)
├── hooks/         ← useVerify, useIssue, useRevoke, useDashboard, useMintNFT, useDID
├── pages/         ← Home, Verify, Issue, Dashboard, Revoke, DID
├── styles/        ← Thème luxury dark, variables CSS
├── types/         ← Types TypeScript partagés
└── utils/         ← hashCertData SHA-256, formatage adresses
```

**Principe :** les composants UI ne touchent jamais Ethers.js directement. Toute la logique blockchain passe par les hooks custom.

### 2.3 Pages réalisées

| Page | Fonctionnalité |
|---|---|
| Accueil | Hero animé, présentation, call-to-action |
| Vérifier | Vérification par CertID, import PDF, détails complets on-chain |
| Émettre | Formulaire + aperçu temps réel + mint NFT + QR Code + PDF |
| Tableau de bord | Historique certificats, stats, actions |
| Révoquer | Révocation avec double confirmation |
| Mon DID | Enregistrement et gestion identité décentralisée |

---

## Phase 3 — QR Code, NFT ERC-721 & DID

### Fonctionnalités réalisées

**QR Code**
- Génération automatique du QR Code après émission (bibliothèque `qrcode.react`)
- QR Code encodant l'URL de vérification `http://localhost:5173/verify?certId=0x...`
- Lecture automatique du QR Code depuis un PDF importé (`jsqr` + `pdfjs-dist`)

**PDF certifié**
- Génération d'un PDF officiel téléchargeable après émission (`pdf-lib`)
- Contient : nom, diplôme, mention, date, NFT token ID, QR Code de vérification
- Import du PDF dans la page Vérifier → extraction automatique du certId

**NFT ERC-721**
- Mint du badge NFT depuis le frontend après émission du certificat
- Hook `useMintNFT` : appelle `mintCertNFT()` puis `linkNFT()` automatiquement
- TokenId affiché dans la vérification et le tableau de bord
- NFT visible dans MetaMask du diplômé

**DID (Decentralized Identifier)**
- Page dédiée **"Mon DID"** dans la navbar
- Enregistrement et mise à jour du DID depuis l'interface
- Affichage du DID `did:ethr:0x...` et statut ACTIF/DÉSACTIVÉ
- Désactivation irréversible avec double confirmation
- DID de l'émetteur affiché lors de chaque vérification de certificat

### Dépendances ajoutées en Phase 3

```bash
npm install qrcode.react pdf-lib qrcode pdfjs-dist jsqr
```

---

## Phase 4 — Déploiement Sepolia ⚠️ En cours

### Objectif

Déployer les 4 Smart Contracts sur le réseau de test **Ethereum Sepolia** pour passer d'un environnement local à un environnement réel et permanent. Les contrats déployés sur Sepolia sont accessibles publiquement et vérifiables sur Etherscan.

### Ce qui a été fait (40%)

- ✅ `hardhat.config.ts` configuré avec le réseau Sepolia
- ✅ Script `deploy.ts` mis à jour — copie automatiquement les adresses dans le frontend
- ✅ Script `accredit.ts` mis à jour — compatible Sepolia et localhost
- ✅ Package `dotenv` installé
- ✅ Compte Alchemy créé — URL RPC Sepolia obtenue
- ✅ 0.05 ETH Sepolia reçus sur le wallet `0xA2E28Ae7AdbE9c127D370f96b2A243686F49d059` (confirmé sur Etherscan Sepolia)
- ✅ Fichier `.env` configuré avec `SEPOLIA_RPC_URL` et `PRIVATE_KEY`

### Point bloquant actuel

Le déploiement échoue avec l'erreur :
```
Balance : 0.0 ETH
ProviderError: insufficient funds for gas
```

La balance affichée par Hardhat est 0.0 ETH alors qu'Etherscan Sepolia confirme **0.05 ETH** sur l'adresse. Cause probable : la clé privée dans `.env` ne correspond pas exactement au compte `0xA2E28...9d059` qui détient les ETH, ou un problème de synchronisation entre l'URL RPC Alchemy et le compte.

### Ce qu'il reste à faire

1. Résoudre le problème de clé privée / balance
2. Lancer le déploiement :
```powershell
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/accredit.ts --network sepolia
```
3. Mettre à jour `frontend/src/abis/deployments.json` avec les adresses Sepolia
4. Vérifier les contrats sur **https://sepolia.etherscan.io**

### Différence Local vs Sepolia

| | Local (actuel) | Sepolia (cible) |
|---|---|---|
| Contrats | Sur le PC seulement | Blockchain permanente |
| Durée | Disparaît à la fermeture | Permanent |
| Accès | Local uniquement | Mondial |
| ETH | Fictifs | ETH de test gratuits |
| Etherscan | ❌ | ✅ Liens vérifiables |

### Pour la démo

Le projet fonctionne à 100% en local. Sepolia est un **plus** pour la soutenance (prouver que c'est un vrai projet blockchain) mais pas obligatoire pour la démonstration des fonctionnalités.

---

## Phase 5 — Documentation & Soutenance 🔜

### Ce qui est fait (30%)

- ✅ README complet avec guide d'installation et d'utilisation
- ✅ Cahier des charges réalisé
- ✅ Architecture documentée

### Ce qui reste

- 🔜 Slides de présentation pour la soutenance
- 🔜 Guide de démo pour la soutenance
- 🔜 Mise à jour finale du README après Phase 4

---

### Commandes utiles

```powershell
# Compiler les contrats
npx hardhat compile

# Lancer tous les tests
npx hardhat test

# Lancer le nœud local
npx hardhat node

# Déployer en local
npx hardhat run scripts/deploy.ts --network localhost

# Accréditer en local
npx hardhat run scripts/accredit.ts --network localhost

# Déployer sur Sepolia (Phase 4)
npx hardhat run scripts/deploy.ts --network sepolia

# Lancer le frontend
npm run dev
```

---

*README maintenu — CertChain DApp v1.4 — Avril 2026*