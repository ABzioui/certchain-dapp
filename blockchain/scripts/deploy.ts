import { network } from "hardhat";
import { writeFileSync } from "fs";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement depuis :", deployer.address);
  console.log("Balance            :", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. CertificateRegistry
  console.log("Déploiement de CertificateRegistry...");
  const registry = await ethers.deployContract("CertificateRegistry");
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("✅ CertificateRegistry :", registryAddr);

  // 2. RevocationList
  console.log("Déploiement de RevocationList...");
  const revList = await ethers.deployContract("RevocationList");
  await revList.waitForDeployment();
  const revListAddr = await revList.getAddress();
  console.log("✅ RevocationList      :", revListAddr);

  // 3. DIDRegistry
  console.log("Déploiement de DIDRegistry...");
  const didReg = await ethers.deployContract("DIDRegistry");
  await didReg.waitForDeployment();
  const didRegAddr = await didReg.getAddress();
  console.log("✅ DIDRegistry         :", didRegAddr);

  // 4. CertNFT
  console.log("Déploiement de CertNFT...");
  const nft = await ethers.deployContract("CertNFT");
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log("✅ CertNFT             :", nftAddr);

  // Sauvegarde des adresses dans deployments.json
  const deployments = {
    network:             network.name,
    deployedAt:          new Date().toISOString(),
    deployer:            deployer.address,
    CertificateRegistry: registryAddr,
    RevocationList:      revListAddr,
    DIDRegistry:         didRegAddr,
    CertNFT:             nftAddr,
  };

  writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));

  console.log("\n=== Résumé ===");
  console.log(deployments);
  console.log("\nAdresses sauvegardées dans deployments.json ✅");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});