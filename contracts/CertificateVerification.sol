// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertificateVerification {
    // Mapping to store certificate hash by its ID
    mapping(string => bytes32) public certificateHashes;

    // Mapping to ensure hash uniqueness
    mapping(bytes32 => bool) public hashExists;
    
    // Mapping to track which addresses can issue certificates
    mapping(address => bool) public authorizedIssuers;
    
    // Owner of the contract
    address public owner;
    
    // Events (like notifications)
    event CertificateIssued(string certificateId, bytes32 certificateHash, address issuer);
    event IssuerAuthorized(address issuer);
    event CertificatesIssuedBulk(string[] certificateIds, bytes32[] certificateHashes, address issuer);
    
    // Constructor - runs when contract is deployed
    constructor() {
        owner = msg.sender; // Person deploying becomes owner
        authorizedIssuers[msg.sender] = true; // Owner can issue certificates
    }
    
    // Modifier to restrict functions to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Modifier to restrict functions to authorized issuers only
    modifier onlyAuthorized() {
        require(authorizedIssuers[msg.sender], "You are not authorized to issue certificates");
        _;
    }
    
    // Function to authorize someone to issue certificates
    function authorizeIssuer(address _issuer) public onlyOwner {
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }
    
    // Function to issue a new certificate
    function issueCertificate(
        string memory _certificateId,
        bytes32 _hash
    ) public onlyAuthorized {
        // Check if certificate ID already exists
        require(certificateHashes[_certificateId] == bytes32(0), "Certificate with this ID already exists");
        // Check if hash is unique
        require(!hashExists[_hash], "This hash is already associated with another certificate");
        
        // Store the hash
        certificateHashes[_certificateId] = _hash;
        hashExists[_hash] = true;
        
        // Emit event
        emit CertificateIssued(_certificateId, _hash, msg.sender);
    }
    
    // Function to issue multiple certificates in one transaction
    function issueCertificatesBulk(
        string[] memory _certificateIds,
        bytes32[] memory _hashes
    ) public onlyAuthorized {
        require(_certificateIds.length == _hashes.length, "Input arrays must have the same length");

        for (uint i = 0; i < _certificateIds.length; i++) {
            string memory _certificateId = _certificateIds[i];
            bytes32 _hash = _hashes[i];

            // Check if certificate ID already exists
            require(certificateHashes[_certificateId] == bytes32(0), "Certificate with this ID already exists");
            // Check if hash is unique
            require(!hashExists[_hash], "This hash is already associated with another certificate");
            
            // Store the hash
            certificateHashes[_certificateId] = _hash;
            hashExists[_hash] = true;
            
            // Emit individual event
            emit CertificateIssued(_certificateId, _hash, msg.sender);
        }

        // Emit bulk event
        emit CertificatesIssuedBulk(_certificateIds, _hashes, msg.sender);
    }
    
    // Function to get a certificate's hash
    function getCertificateHash(string memory _certificateId) 
        public 
        view 
        returns (bytes32) 
    {
        return certificateHashes[_certificateId];
    }
    
    // Function to check if certificate exists
    function certificateExists(string memory _certificateId) public view returns (bool) {
        return certificateHashes[_certificateId] != bytes32(0);
    }
}
