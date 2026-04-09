import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Test d'intégration : flow complet émission + mint NFT + linkNFT
 *
 * Flow simulé :
 * 1. L'établissement émet un certificat (CertificateRegistry)
 * 2. L'établissement minte le badge NFT (CertNFT)
 * 3. L'établissement lie le tokenId au certId (linkNFT)
 * 4. Vérification que tout est cohérent on-chain
 */

describe("Intégration — CertificateRegistry + CertNFT", function () {
  let registry: any;
  let certNFT: any;
  let owner: any, issuer: any, diplome: any, recruteur: any;

  const CERT_DATA = "Alice Martin — Master Informatique — Mention Très Bien — 2024";
  const CERT_HASH = ethers.keccak256(ethers.toUtf8Bytes(CERT_DATA));
  const IPFS_META = "QmCertMetadata_AliceMartin_2024";
  const IPFS_NFT  = "ipfs://QmNFTBadge_AliceMartin_2024";

  beforeEach(async () => {
    [owner, issuer, diplome, recruteur] = await ethers.getSigners();

    // Déploiement des deux contrats
    registry = await ethers.deployContract("CertificateRegistry");
    certNFT  = await ethers.deployContract("CertNFT");

    // Accréditer l'établissement dans les deux contrats
    await registry.accreditIssuer(issuer.address);
    await certNFT.addMinter(issuer.address);
  });

  // ─── Flow complet ──────────────────────────────────────────────────────────

  it("flow complet : émission → mint NFT → linkNFT → vérification", async () => {
    // ÉTAPE 1 : L'établissement émet le certificat on-chain
    const issueTx = await registry.connect(issuer).issueCertificate(CERT_HASH, IPFS_META);
    const issueReceipt = await issueTx.wait();

    const issueEvent = issueReceipt?.logs
      .map((log: any) => { try { return registry.interface.parseLog(log); } catch { return null; } })
      .find((e: any) => e?.name === "CertificateIssued");

    const certId: string = issueEvent!.args.certId;
    expect(certId).to.not.equal(ethers.ZeroHash);

    // ÉTAPE 2 : L'établissement minte le badge NFT pour le diplômé
    const mintTx = await certNFT.connect(issuer).mintCertNFT(diplome.address, certId, IPFS_NFT);
    const mintReceipt = await mintTx.wait();

    const mintEvent = mintReceipt?.logs
      .map((log: any) => { try { return certNFT.interface.parseLog(log); } catch { return null; } })
      .find((e: any) => e?.name === "CertNFTMinted");

    const tokenId: bigint = mintEvent!.args.tokenId;
    expect(tokenId).to.equal(0n);

    // ÉTAPE 3 : L'établissement lie le tokenId au certId dans le registry
    await expect(registry.connect(issuer).linkNFT(certId, tokenId))
      .to.emit(registry, "NFTLinked")
      .withArgs(certId, tokenId);

    // ÉTAPE 4 : Vérification cohérence on-chain
    const cert = await registry.getCertificate(certId);
    expect(cert.certHash).to.equal(CERT_HASH);
    expect(cert.issuer).to.equal(issuer.address);
    expect(cert.revoked).to.be.false;
    expect(cert.nftTokenId).to.equal(tokenId);
    expect(cert.ipfsHash).to.equal(IPFS_META);

    // Vérification côté NFT
    expect(await certNFT.ownerOf(tokenId)).to.equal(diplome.address);
    expect(await certNFT.getCertId(tokenId)).to.equal(certId);
    expect(await certNFT.tokenURI(tokenId)).to.equal(IPFS_NFT);
  });

  // ─── Vérification publique (recruteur) ────────────────────────────────────

  it("un recruteur peut vérifier le certificat sans wallet spécial", async () => {
    // Setup : émettre + minter + lier
    const issueTx = await registry.connect(issuer).issueCertificate(CERT_HASH, IPFS_META);
    const receipt = await issueTx.wait();
    const certId: string = receipt?.logs
      .map((log: any) => { try { return registry.interface.parseLog(log); } catch { return null; } })
      .find((e: any) => e?.name === "CertificateIssued")!.args.certId;

    const mintTx = await certNFT.connect(issuer).mintCertNFT(diplome.address, certId, IPFS_NFT);
    const mintReceipt = await mintTx.wait();
    const tokenId: bigint = mintReceipt?.logs
      .map((log: any) => { try { return certNFT.interface.parseLog(log); } catch { return null; } })
      .find((e: any) => e?.name === "CertNFTMinted")!.args.tokenId;
    await registry.connect(issuer).linkNFT(certId, tokenId);

    // Le recruteur consulte (lecture seule, pas de wallet nécessaire)
    const cert = await registry.connect(recruteur).getCertificate(certId);
    expect(cert.revoked).to.be.false;
    expect(cert.issuer).to.equal(issuer.address);
    expect(cert.nftTokenId).to.equal(0n);
  });

  // ─── Révocation après mint ────────────────────────────────────────────────

  it("la révocation après mint invalide le certificat mais garde le NFT", async () => {
    // Émettre + minter + lier
    const issueTx = await registry.connect(issuer).issueCertificate(CERT_HASH, IPFS_META);
    const receipt = await issueTx.wait();
    const certId: string = receipt?.logs
      .map((log: any) => { try { return registry.interface.parseLog(log); } catch { return null; } })
      .find((e: any) => e?.name === "CertificateIssued")!.args.certId;

    await certNFT.connect(issuer).mintCertNFT(diplome.address, certId, IPFS_NFT);

    // Révoquer le certificat
    await registry.connect(issuer).revokeCertificate(certId);

    // Le certificat est révoqué
    const cert = await registry.getCertificate(certId);
    expect(cert.revoked).to.be.true;

    // Le NFT existe toujours (preuve historique), mais le cert est invalide
    expect(await certNFT.ownerOf(0)).to.equal(diplome.address);
  });

  // ─── Sécurité : linkNFT par un tiers ─────────────────────────────────────

  it("un tiers ne peut pas lier un NFT à un certificat qu'il n'a pas émis", async () => {
    const issueTx = await registry.connect(issuer).issueCertificate(CERT_HASH, IPFS_META);
    const receipt = await issueTx.wait();
    const certId: string = receipt?.logs
      .map((log: any) => { try { return registry.interface.parseLog(log); } catch { return null; } })
      .find((e: any) => e?.name === "CertificateIssued")!.args.certId;

    await expect(registry.connect(recruteur).linkNFT(certId, 0n))
      .to.be.revertedWith("CertificateRegistry: not authorized");
  });
});