import { expect } from "chai";
import { network } from "hardhat";
import {} from "hardhat"

const { ethers } = await network.connect();

describe("CertificateVerification", function () {
  it("Should set deployer as owner and authorized issuer", async function () {
    const certificateContract = await ethers.deployContract("CertificateVerification");

    const owner = await certificateContract.owner();
    const isAuthorized = await certificateContract.authorizedIssuers(owner);

    expect(isAuthorized).to.be.true;
  });

  it("Should authorize another issuer", async function () {
    const certificateContract = await ethers.deployContract("CertificateVerification");
    const [, issuer] = await ethers.getSigners();

    await expect(certificateContract.authorizeIssuer(issuer.address))
      .to.emit(certificateContract, "IssuerAuthorized")
      .withArgs(issuer.address);

    const isAuthorized = await certificateContract.authorizedIssuers(issuer.address);
    expect(isAuthorized).to.be.true;
  });

  it("Should allow authorized issuer to issue a certificate", async function () {
    const certificateContract = await ethers.deployContract("CertificateVerification");
    const [, issuer] = await ethers.getSigners();

    await certificateContract.authorizeIssuer(issuer.address);

    await expect(
      certificateContract.connect(issuer).issueCertificate("Alice", "RN123", 95, "CERT001")
    )
      .to.emit(certificateContract, "CertificateIssued")
      .withArgs("CERT001", "Alice");

    const cert = await certificateContract.certificates("CERT001");

    expect(cert.name).to.equal("Alice");
    expect(cert.rollNumber).to.equal("RN123");
    expect(cert.marks).to.equal(95);
    expect(cert.certificateId).to.equal("CERT001");
    expect(cert.exists).to.be.true;
    expect(cert.issuer).to.equal(issuer.address);
  });

  it("Should not allow unauthorized address to issue a certificate", async function () {
    const certificateContract = await ethers.deployContract("CertificateVerification");
    const [, , unauthorizedAccount] = await ethers.getSigners();

    await expect(
      certificateContract.connect(unauthorizedAccount).issueCertificate("Bob", "RN456", 88, "CERT002")
    ).to.be.revertedWith("You are not authorized to issue certificates");
  });

  it("Should verify an existing certificate correctly", async function () {
    const certificateContract = await ethers.deployContract("CertificateVerification");
    const [, issuer] = await ethers.getSigners();

    await certificateContract.authorizeIssuer(issuer.address);
    await certificateContract.connect(issuer).issueCertificate("Alice", "RN123", 95, "CERT001");

    const [name, rollNumber, marks, issueDate, certIssuer, isValid] =
      await certificateContract.verifyCertificate("CERT001");

    expect(name).to.equal("Alice");
    expect(rollNumber).to.equal("RN123");
    expect(marks).to.equal(95);
    expect(isValid).to.be.true;
    expect(certIssuer).to.equal(issuer.address);
    expect(issueDate.toNumber()).to.be.greaterThan(0);
  });

  it("Should return false for non-existent certificate", async function () {
    const certificateContract = await ethers.deployContract("CertificateVerification");

    const exists = await certificateContract.certificateExists("NON_EXISTENT_CERT");

    expect(exists).to.be.false;
  });

  it("Should return true for existing certificate", async function () {
    const certificateContract = await ethers.deployContract("CertificateVerification");
    const [, issuer] = await ethers.getSigners();

    await certificateContract.authorizeIssuer(issuer.address);
    await certificateContract.connect(issuer).issueCertificate("Alice", "RN123", 95, "CERT001");

    const exists = await certificateContract.certificateExists("CERT001");

    expect(exists).to.be.true;
  });
});
