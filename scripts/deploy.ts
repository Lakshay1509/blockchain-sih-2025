import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Deploying CertificateVerification contract...");

  const certificateContract = await ethers.deployContract("CertificateVerification");

  console.log("CertificateVerification deployed to:", certificateContract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});