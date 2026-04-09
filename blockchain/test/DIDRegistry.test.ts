import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

const INSTITUTION_NAME = "Université Paris-Saclay";
const IPFS_DOC         = "QmDIDDoc123";

describe("DIDRegistry", function () {
  let didRegistry: any;
  let institution: any, student: any;

  beforeEach(async () => {
    [, institution, student] = await ethers.getSigners();
    didRegistry = await ethers.deployContract("DIDRegistry");
  });

  describe("Enregistrement DID", () => {
    it("une entité peut enregistrer son DID", async () => {
      await expect(didRegistry.connect(institution).registerDID(INSTITUTION_NAME, IPFS_DOC))
        .to.emit(didRegistry, "DIDRegistered")
        .withArgs(institution.address, INSTITUTION_NAME, IPFS_DOC, (v: bigint) => v > 0n);
      expect(await didRegistry.isActiveDID(institution.address)).to.be.true;
    });

    it("nom vide rejeté", async () => {
      await expect(didRegistry.connect(institution).registerDID("", IPFS_DOC))
        .to.be.revertedWith("DIDRegistry: name required");
    });

    it("ipfsDocHash vide accepté", async () => {
      await expect(didRegistry.connect(institution).registerDID(INSTITUTION_NAME, ""))
        .to.emit(didRegistry, "DIDRegistered");
    });
  });

  describe("Mise à jour DID", () => {
    beforeEach(async () => {
      await didRegistry.connect(institution).registerDID(INSTITUTION_NAME, IPFS_DOC);
    });

    it("émet DIDUpdated lors d'une mise à jour", async () => {
      await expect(didRegistry.connect(institution).registerDID("Nouveau Nom", "QmNew"))
        .to.emit(didRegistry, "DIDUpdated")
        .withArgs(institution.address, "Nouveau Nom", "QmNew", (v: bigint) => v > 0n);
    });

    it("les nouvelles valeurs sont stockées", async () => {
      await didRegistry.connect(institution).registerDID("Nouveau Nom", "QmNew");
      const doc = await didRegistry.resolveDID(institution.address);
      expect(doc.name).to.equal("Nouveau Nom");
      expect(doc.ipfsDocHash).to.equal("QmNew");
    });
  });

  describe("Désactivation DID", () => {
    beforeEach(async () => {
      await didRegistry.connect(institution).registerDID(INSTITUTION_NAME, IPFS_DOC);
    });

    it("l'entité peut désactiver son DID", async () => {
      await expect(didRegistry.connect(institution).deactivateDID())
        .to.emit(didRegistry, "DIDDeactivated")
        .withArgs(institution.address, (v: bigint) => v > 0n);
      expect(await didRegistry.isActiveDID(institution.address)).to.be.false;
    });

    it("impossible de désactiver un DID non enregistré", async () => {
      await expect(didRegistry.connect(student).deactivateDID())
        .to.be.revertedWith("DIDRegistry: DID not found");
    });

    it("impossible de désactiver deux fois", async () => {
      await didRegistry.connect(institution).deactivateDID();
      await expect(didRegistry.connect(institution).deactivateDID())
        .to.be.revertedWith("DIDRegistry: already deactivated");
    });
  });

  describe("Résolution DID", () => {
    it("resolveDID retourne les bonnes données", async () => {
      await didRegistry.connect(institution).registerDID(INSTITUTION_NAME, IPFS_DOC);
      const doc = await didRegistry.resolveDID(institution.address);
      expect(doc.name).to.equal(INSTITUTION_NAME);
      expect(doc.ipfsDocHash).to.equal(IPFS_DOC);
      expect(doc.active).to.be.true;
      expect(doc.registeredAt).to.be.greaterThan(0n);
    });

    it("resolveDID sur DID inconnu retourne une erreur", async () => {
      await expect(didRegistry.resolveDID(student.address))
        .to.be.revertedWith("DIDRegistry: DID not found");
    });

    it("getDIDUri retourne le format did:ethr: correct", async () => {
      const uri = await didRegistry.getDIDUri(institution.address);
      const expected = `did:ethr:0x${institution.address.slice(2).toLowerCase()}`;
      expect(uri.toLowerCase()).to.equal(expected.toLowerCase());
    });
  });
});