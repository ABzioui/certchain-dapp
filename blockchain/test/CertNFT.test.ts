import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

const CERT_ID  = ethers.keccak256(ethers.toUtf8Bytes("cert-001"));
const IPFS_URI = "ipfs://QmBadgeMetadata123";

describe("CertNFT", function () {
  let certNFT: any;
  let owner: any, minter: any, recipient: any, stranger: any;

  beforeEach(async () => {
    [owner, minter, recipient, stranger] = await ethers.getSigners();
    certNFT = await ethers.deployContract("CertNFT");
  });

  describe("Métadonnées ERC-721", () => {
    it("nom et symbole corrects", async () => {
      expect(await certNFT.name()).to.equal("CertChain Certificate");
      expect(await certNFT.symbol()).to.equal("CERT");
    });
  });

  describe("Gestion des minters", () => {
    it("owner peut ajouter un minter", async () => {
      await expect(certNFT.addMinter(minter.address))
        .to.emit(certNFT, "MinterAdded")
        .withArgs(minter.address);
      expect(await certNFT.isMinter(minter.address)).to.be.true;
    });

    it("non-owner ne peut pas ajouter un minter", async () => {
      await expect(certNFT.connect(stranger).addMinter(minter.address))
        .to.be.revertedWithCustomError(certNFT, "OwnableUnauthorizedAccount");
    });

    it("owner peut retirer un minter", async () => {
      await certNFT.addMinter(minter.address);
      await expect(certNFT.removeMinter(minter.address))
        .to.emit(certNFT, "MinterRemoved")
        .withArgs(minter.address);
      expect(await certNFT.isMinter(minter.address)).to.be.false;
    });

    it("owner est toujours minter", async () => {
      expect(await certNFT.isMinter(owner.address)).to.be.true;
    });
  });

  describe("Minting NFT", () => {
    beforeEach(async () => { await certNFT.addMinter(minter.address); });

    it("minter autorisé peut minter un NFT", async () => {
      await expect(certNFT.connect(minter).mintCertNFT(recipient.address, CERT_ID, IPFS_URI))
        .to.emit(certNFT, "CertNFTMinted")
        .withArgs(0n, CERT_ID, recipient.address, IPFS_URI);
      expect(await certNFT.ownerOf(0)).to.equal(recipient.address);
      expect(await certNFT.balanceOf(recipient.address)).to.equal(1n);
    });

    it("stranger ne peut pas minter", async () => {
      await expect(certNFT.connect(stranger).mintCertNFT(recipient.address, CERT_ID, IPFS_URI))
        .to.be.revertedWith("CertNFT: not authorized minter");
    });

    it("recipient zéro rejeté", async () => {
      await expect(certNFT.connect(minter).mintCertNFT(ethers.ZeroAddress, CERT_ID, IPFS_URI))
        .to.be.revertedWith("CertNFT: zero recipient");
    });

    it("certId zéro rejeté", async () => {
      await expect(certNFT.connect(minter).mintCertNFT(recipient.address, ethers.ZeroHash, IPFS_URI))
        .to.be.revertedWith("CertNFT: invalid certId");
    });

    it("URI vide rejetée", async () => {
      await expect(certNFT.connect(minter).mintCertNFT(recipient.address, CERT_ID, ""))
        .to.be.revertedWith("CertNFT: empty URI");
    });

    it("tokenId incrémente correctement", async () => {
      expect(await certNFT.nextTokenId()).to.equal(0n);
      await certNFT.connect(minter).mintCertNFT(recipient.address, CERT_ID, IPFS_URI);
      expect(await certNFT.nextTokenId()).to.equal(1n);
      const CERT_ID_2 = ethers.keccak256(ethers.toUtf8Bytes("cert-002"));
      await certNFT.connect(minter).mintCertNFT(recipient.address, CERT_ID_2, IPFS_URI);
      expect(await certNFT.nextTokenId()).to.equal(2n);
    });

    it("plusieurs tokens pour le même diplômé", async () => {
      const CERT_ID_2 = ethers.keccak256(ethers.toUtf8Bytes("cert-002"));
      await certNFT.connect(minter).mintCertNFT(recipient.address, CERT_ID, IPFS_URI);
      await certNFT.connect(minter).mintCertNFT(recipient.address, CERT_ID_2, IPFS_URI);
      expect(await certNFT.balanceOf(recipient.address)).to.equal(2n);
    });
  });

  describe("Lecture NFT", () => {
    beforeEach(async () => {
      await certNFT.addMinter(minter.address);
      await certNFT.connect(minter).mintCertNFT(recipient.address, CERT_ID, IPFS_URI);
    });

    it("tokenURI retourne l'URI IPFS", async () => {
      expect(await certNFT.tokenURI(0)).to.equal(IPFS_URI);
    });

    it("getCertId retourne le certId associé", async () => {
      expect(await certNFT.getCertId(0)).to.equal(CERT_ID);
    });

    it("tokenURI sur token inexistant retourne une erreur", async () => {
      await expect(certNFT.tokenURI(999))
        .to.be.revertedWith("CertNFT: token does not exist");
    });

    it("getCertId sur token inexistant retourne une erreur", async () => {
      await expect(certNFT.getCertId(999))
        .to.be.revertedWith("CertNFT: token does not exist");
    });
  });
});