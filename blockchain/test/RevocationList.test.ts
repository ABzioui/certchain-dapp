import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

const CERT_ID = ethers.keccak256(ethers.toUtf8Bytes("cert-001"));
const REASON   = "Diplôme falsifié";

describe("RevocationList", function () {
  let revList: any;
  let owner: any, revoker: any, stranger: any;

  beforeEach(async () => {
    [owner, revoker, stranger] = await ethers.getSigners();
    revList = await ethers.deployContract("RevocationList");
  });

  describe("Gestion des revokers", () => {
    it("owner peut ajouter un revoker", async () => {
      await expect(revList.addRevoker(revoker.address))
        .to.emit(revList, "RevokerAdded")
        .withArgs(revoker.address);
      expect(await revList.isAuthorizedRevoker(revoker.address)).to.be.true;
    });

    it("non-owner ne peut pas ajouter un revoker", async () => {
      await expect(revList.connect(stranger).addRevoker(revoker.address))
        .to.be.revertedWithCustomError(revList, "OwnableUnauthorizedAccount");
    });

    it("owner peut retirer un revoker", async () => {
      await revList.addRevoker(revoker.address);
      await expect(revList.removeRevoker(revoker.address))
        .to.emit(revList, "RevokerRemoved")
        .withArgs(revoker.address);
      expect(await revList.isAuthorizedRevoker(revoker.address)).to.be.false;
    });

    it("owner est toujours autorisé", async () => {
      expect(await revList.isAuthorizedRevoker(owner.address)).to.be.true;
    });
  });

  describe("Révocation", () => {
    beforeEach(async () => { await revList.addRevoker(revoker.address); });

    it("revoker autorisé peut révoquer avec motif", async () => {
      await expect(revList.connect(revoker).revoke(CERT_ID, REASON))
        .to.emit(revList, "Revoked");
      expect(await revList.isRevoked(CERT_ID)).to.be.true;
    });

    it("owner peut révoquer directement", async () => {
      await expect(revList.revoke(CERT_ID, REASON))
        .to.emit(revList, "Revoked");
      expect(await revList.isRevoked(CERT_ID)).to.be.true;
    });

    it("stranger ne peut pas révoquer", async () => {
      await expect(revList.connect(stranger).revoke(CERT_ID, REASON))
        .to.be.revertedWith("RevocationList: not authorized");
    });

    it("impossible de révoquer deux fois le même certId", async () => {
      await revList.connect(revoker).revoke(CERT_ID, REASON);
      await expect(revList.connect(revoker).revoke(CERT_ID, "autre raison"))
        .to.be.revertedWith("RevocationList: already revoked");
    });

    it("motif vide accepté", async () => {
      await expect(revList.connect(revoker).revoke(CERT_ID, ""))
        .to.emit(revList, "Revoked");
    });
  });

  describe("Lecture", () => {
    it("isRevoked retourne false pour un certId inconnu", async () => {
      const unknownId = ethers.keccak256(ethers.toUtf8Bytes("unknown"));
      expect(await revList.isRevoked(unknownId)).to.be.false;
    });

    it("getRevocationInfo retourne les bons détails", async () => {
      await revList.addRevoker(revoker.address);
      await revList.connect(revoker).revoke(CERT_ID, REASON);
      const info = await revList.getRevocationInfo(CERT_ID);
      expect(info.revokedBy).to.equal(revoker.address);
      expect(info.revokedAt).to.be.greaterThan(0n);
      expect(info.reason).to.equal(REASON);
    });

    it("getRevocationInfo retourne zéros pour un certId non révoqué", async () => {
      const info = await revList.getRevocationInfo(CERT_ID);
      expect(info.revokedBy).to.equal(ethers.ZeroAddress);
      expect(info.revokedAt).to.equal(0n);
    });
  });
});