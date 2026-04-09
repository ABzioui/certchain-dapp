import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

const CERT_HASH = ethers.keccak256(ethers.toUtf8Bytes("Jean Dupont — Master Info 2024"));
const IPFS_HASH = "QmXyz123abc";

async function issueCert(registry: any, issuer: any, hash = CERT_HASH, ipfs = IPFS_HASH) {
  const tx = await registry.connect(issuer).issueCertificate(hash, ipfs);
  const receipt = await tx.wait();
  const event = receipt?.logs
    .map((log: any) => { try { return registry.interface.parseLog(log); } catch { return null; } })
    .find((e: any) => e?.name === "CertificateIssued");
  return event!.args.certId as string;
}

describe("CertificateRegistry", function () {
  let registry: any;
  let owner: any, issuer: any, stranger: any;

  beforeEach(async () => {
    [owner, issuer, stranger] = await ethers.getSigners();
    registry = await ethers.deployContract("CertificateRegistry");
  });

  describe("Accréditation des émetteurs", () => {
    it("owner peut accréditer un émetteur", async () => {
      await expect(registry.accreditIssuer(issuer.address))
        .to.emit(registry, "IssuerAccredited")
        .withArgs(issuer.address);
      expect(await registry.isAccredited(issuer.address)).to.be.true;
    });

    it("non-owner ne peut pas accréditer", async () => {
      await expect(registry.connect(stranger).accreditIssuer(issuer.address))
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("owner peut retirer l'accréditation", async () => {
      await registry.accreditIssuer(issuer.address);
      await expect(registry.revokeIssuerAccreditation(issuer.address))
        .to.emit(registry, "IssuerRevoked")
        .withArgs(issuer.address);
      expect(await registry.isAccredited(issuer.address)).to.be.false;
    });

    it("adresse zéro rejetée", async () => {
      await expect(registry.accreditIssuer(ethers.ZeroAddress))
        .to.be.revertedWith("CertificateRegistry: zero address");
    });
  });

  describe("Émission de certificat", () => {
    beforeEach(async () => { await registry.accreditIssuer(issuer.address); });

    it("émetteur accrédité peut émettre un certificat", async () => {
      const certId = await issueCert(registry, issuer);
      const cert = await registry.getCertificate(certId);
      expect(cert.certHash).to.equal(CERT_HASH);
      expect(cert.issuer).to.equal(issuer.address);
      expect(cert.revoked).to.be.false;
      expect(cert.ipfsHash).to.equal(IPFS_HASH);
    });

    it("non-accrédité ne peut pas émettre", async () => {
      await expect(registry.connect(stranger).issueCertificate(CERT_HASH, IPFS_HASH))
        .to.be.revertedWith("CertificateRegistry: not accredited");
    });

    it("émet l'event CertificateIssued", async () => {
      await expect(registry.connect(issuer).issueCertificate(CERT_HASH, IPFS_HASH))
        .to.emit(registry, "CertificateIssued");
    });
  });

  describe("Révocation de certificat", () => {
    let certId: string;
    beforeEach(async () => {
      await registry.accreditIssuer(issuer.address);
      certId = await issueCert(registry, issuer);
    });

    it("l'émetteur peut révoquer son certificat", async () => {
      await expect(registry.connect(issuer).revokeCertificate(certId))
        .to.emit(registry, "CertificateRevoked");
      expect((await registry.getCertificate(certId)).revoked).to.be.true;
    });

    it("owner peut révoquer n'importe quel certificat", async () => {
      await expect(registry.revokeCertificate(certId))
        .to.emit(registry, "CertificateRevoked");
    });

    it("stranger ne peut pas révoquer", async () => {
      await expect(registry.connect(stranger).revokeCertificate(certId))
        .to.be.revertedWith("CertificateRegistry: not authorized");
    });

    it("impossible de révoquer deux fois", async () => {
      await registry.connect(issuer).revokeCertificate(certId);
      await expect(registry.connect(issuer).revokeCertificate(certId))
        .to.be.revertedWith("CertificateRegistry: already revoked");
    });

    it("certId inconnu rejeté", async () => {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(registry.connect(issuer).revokeCertificate(fakeId))
        .to.be.revertedWith("CertificateRegistry: cert not found");
    });
  });

  describe("Lecture de certificat", () => {
    it("getCertificate sur certId inconnu retourne une erreur", async () => {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("unknown"));
      await expect(registry.getCertificate(fakeId))
        .to.be.revertedWith("CertificateRegistry: cert not found");
    });
  });
});