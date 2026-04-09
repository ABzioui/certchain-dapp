import { network } from "hardhat";
import { readFileSync } from "fs";

const { ethers } = await network.connect();

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner (admin)  :", owner.address);

  // Lire les adresses depuis deployments.json
  const deployments = JSON.parse(readFileSync("deployments.json", "utf8"));
  console.log("Registry addr  :", deployments.CertificateRegistry);

  // Instancier le contrat
  const registry = await ethers.getContractAt(
    "CertificateRegistry",
    deployments.CertificateRegistry
  );

  // Accréditer le compte #0 (owner lui-même pour les tests)
  const issuerAddress = owner.address;
  console.log("\nAccréditation de :", issuerAddress);

  const tx = await registry.accreditIssuer(issuerAddress);
  await tx.wait();

  console.log("✅ Établissement accrédité !");
  console.log("   Tx hash :", tx.hash);

  // Vérification
  const isOk = await registry.isAccredited(issuerAddress);
  console.log("   Vérifié  :", isOk ? "OUI ✅" : "NON ❌");

  // Enregistrer aussi un DID pour cet émetteur
  const didRegistry = await ethers.getContractAt(
    "DIDRegistry",
    deployments.DIDRegistry
  );

  const tx2 = await didRegistry.registerDID(
    "Établissement de test — Hardhat Local",
    ""
  );
  await tx2.wait();
  console.log("\n✅ DID enregistré pour l'émetteur !");

  console.log("\n=== Prêt à émettre des certificats ===");
  console.log("Connecte ce compte dans MetaMask :");
  console.log("Adresse :", issuerAddress);
  console.log("Clé privée : 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});