import { expect } from "chai";
import { network } from "hardhat";


const { ethers } = await network.connect();
describe("CertificateVerification", function () {
  let certificateContract: any;
  let owner: any;
  let issuer: any;
  let unauthorizedAccount: any;

  beforeEach(async function () {
    [owner, issuer, unauthorizedAccount] = await ethers.getSigners();
    const CertificateVerification = await ethers.getContractFactory("CertificateVerification");
    certificateContract = await CertificateVerification.deploy();
  });

  it("Should set deployer as owner and authorized issuer", async function () {
    const contractOwner = await certificateContract.owner();
    expect(contractOwner).to.equal(owner.address);

    const isAuthorized = await certificateContract.authorizedIssuers(owner.address);
    expect(isAuthorized).to.be.true;
  });

  it("Should allow owner to authorize a new issuer", async function () {
    await expect(certificateContract.authorizeIssuer(issuer.address))
      .to.emit(certificateContract, "IssuerAuthorized")
      .withArgs(issuer.address);

    const isAuthorized = await certificateContract.authorizedIssuers(issuer.address);
    expect(isAuthorized).to.be.true;
  });

  it("Should allow authorized issuer to issue a certificate", async function () {
    await certificateContract.authorizeIssuer(issuer.address);
    const certificateId = "CERT001";
    const certificateHash = ethers.keccak256(ethers.toUtf8Bytes("TestCertificateData"));

    await expect(
      certificateContract.connect(issuer).issueCertificate(certificateId, certificateHash)
    )
      .to.emit(certificateContract, "CertificateIssued")
      .withArgs(certificateId, certificateHash, issuer.address);

    const storedHash = await certificateContract.getCertificateHash(certificateId);
    expect(storedHash).to.equal(certificateHash);
  });

  it("Should not allow unauthorized address to issue a certificate", async function () {
    const certificateId = "CERT002";
    const certificateHash = ethers.keccak256(ethers.toUtf8Bytes("AnotherCertificate"));

    await expect(
      certificateContract.connect(unauthorizedAccount).issueCertificate(certificateId, certificateHash)
    ).to.be.revertedWith("You are not authorized to issue certificates");
  });

  it("Should fail to issue a certificate with a duplicate ID", async function () {
    const certificateId = "CERT001";
    const firstHash = ethers.keccak256(ethers.toUtf8Bytes("FirstData"));
    const secondHash = ethers.keccak256(ethers.toUtf8Bytes("SecondData"));

    await certificateContract.issueCertificate(certificateId, firstHash);

    await expect(
      certificateContract.issueCertificate(certificateId, secondHash)
    ).to.be.revertedWith("Certificate with this ID already exists");
  });

  it("Should fail to issue a certificate with a duplicate hash", async function () {
    const certificateHash = ethers.keccak256(ethers.toUtf8Bytes("UniqueData"));
    
    await certificateContract.issueCertificate("CERT001", certificateHash);

    await expect(
      certificateContract.issueCertificate("CERT002", certificateHash)
    ).to.be.revertedWith("This hash is already associated with another certificate");
  });

  it("Should retrieve the correct hash for a given certificate ID", async function () {
    const certificateId = "CERT001";
    const certificateHash = ethers.keccak256(ethers.toUtf8Bytes("MyCertificateData"));

    await certificateContract.issueCertificate(certificateId, certificateHash);

    const retrievedHash = await certificateContract.getCertificateHash(certificateId);
    expect(retrievedHash).to.equal(certificateHash);
  });

  it("Should return a zero hash for a non-existent certificate ID", async function () {
    const retrievedHash = await certificateContract.getCertificateHash("NON_EXISTENT_CERT");
    expect(retrievedHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("Should return false for a non-existent certificate", async function () {
    const exists = await certificateContract.certificateExists("NON_EXISTENT_CERT");
    expect(exists).to.be.false;
  });

  it("Should return true for an existing certificate", async function () {
    const certificateId = "CERT001";
    const certificateHash = ethers.keccak256(ethers.toUtf8Bytes("SomeData"));

    await certificateContract.issueCertificate(certificateId, certificateHash);

    const exists = await certificateContract.certificateExists(certificateId);
    expect(exists).to.be.true;
  });

  describe("issueCertificatesBulk", function () {
    it("Should allow an authorized issuer to issue multiple certificates", async function () {
      await certificateContract.authorizeIssuer(issuer.address);
      const certificateIds = ["BULK001", "BULK002"];
      const certificateHashes = [
        ethers.keccak256(ethers.toUtf8Bytes("BulkData1")),
        ethers.keccak256(ethers.toUtf8Bytes("BulkData2")),
      ];

      const tx = await certificateContract.connect(issuer).issueCertificatesBulk(certificateIds, certificateHashes);
      await expect(tx)
        .to.emit(certificateContract, "CertificatesIssuedBulk")
        .withArgs(certificateIds, certificateHashes, issuer.address);
      
      await expect(tx)
        .to.emit(certificateContract, "CertificateIssued")
        .withArgs(certificateIds[0], certificateHashes[0], issuer.address);

      await expect(tx)
        .to.emit(certificateContract, "CertificateIssued")
        .withArgs(certificateIds[1], certificateHashes[1], issuer.address);

      const storedHash1 = await certificateContract.getCertificateHash("BULK001");
      expect(storedHash1).to.equal(certificateHashes[0]);
      const storedHash2 = await certificateContract.getCertificateHash("BULK002");
      expect(storedHash2).to.equal(certificateHashes[1]);
    });

    it("Should revert if input arrays have different lengths", async function () {
      const certificateIds = ["BULK001"];
      const certificateHashes = [
        ethers.keccak256(ethers.toUtf8Bytes("BulkData1")),
        ethers.keccak256(ethers.toUtf8Bytes("BulkData2")),
      ];

      await expect(
        certificateContract.issueCertificatesBulk(certificateIds, certificateHashes)
      ).to.be.revertedWith("Input arrays must have the same length");
    });

    it("Should not allow unauthorized address to issue certificates in bulk", async function () {
      const certificateIds = ["BULK001", "BULK002"];
      const certificateHashes = [
        ethers.keccak256(ethers.toUtf8Bytes("BulkData1")),
        ethers.keccak256(ethers.toUtf8Bytes("BulkData2")),
      ];

      await expect(
        certificateContract.connect(unauthorizedAccount).issueCertificatesBulk(certificateIds, certificateHashes)
      ).to.be.revertedWith("You are not authorized to issue certificates");
    });

    it("Should revert if one of the certificate IDs already exists", async function () {
      const existingId = "CERT001";
      await certificateContract.issueCertificate(existingId, ethers.keccak256(ethers.toUtf8Bytes("InitialData")));

      const certificateIds = ["BULK001", existingId];
      const certificateHashes = [
        ethers.keccak256(ethers.toUtf8Bytes("BulkData1")),
        ethers.keccak256(ethers.toUtf8Bytes("BulkData2")),
      ];

      await expect(
        certificateContract.issueCertificatesBulk(certificateIds, certificateHashes)
      ).to.be.revertedWith("Certificate with this ID already exists");
    });

    it("Should revert if one of the certificate hashes already exists", async function () {
      const existingHash = ethers.keccak256(ethers.toUtf8Bytes("InitialData"));
      await certificateContract.issueCertificate("CERT001", existingHash);

      const certificateIds = ["BULK001", "BULK002"];
      const certificateHashes = [
        ethers.keccak256(ethers.toUtf8Bytes("BulkData1")),
        existingHash,
      ];

      await expect(
        certificateContract.issueCertificatesBulk(certificateIds, certificateHashes)
      ).to.be.revertedWith("This hash is already associated with another certificate");
    });
  });
});
