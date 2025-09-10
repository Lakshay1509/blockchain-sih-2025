// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertificateVerification {
    // Structure to hold certificate data
    struct Certificate {
        string name;
        string rollNumber;
        uint256 marks;
        string certificateId;
        uint256 issueDate;
        address issuer;
        bool exists;
    }
    
    // Mapping to store certificates by their ID
    mapping(string => Certificate) public certificates;
    
    // Mapping to track which addresses can issue certificates
    mapping(address => bool) public authorizedIssuers;
    
    // Owner of the contract
    address public owner;
    
    // Events (like notifications)
    event CertificateIssued(string certificateId, string studentName);
    event IssuerAuthorized(address issuer);
    
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
        string memory _name,
        string memory _rollNumber,
        uint256 _marks,
        string memory _certificateId
    ) public onlyAuthorized {
        // Check if certificate already exists
        require(!certificates[_certificateId].exists, "Certificate with this ID already exists");
        
        // Create new certificate
        certificates[_certificateId] = Certificate({
            name: _name,
            rollNumber: _rollNumber,
            marks: _marks,
            certificateId: _certificateId,
            issueDate: block.timestamp,
            issuer: msg.sender,
            exists: true
        });
        
        // Emit event
        emit CertificateIssued(_certificateId, _name);
    }
    
    // Function to verify a certificate
    function verifyCertificate(string memory _certificateId) 
        public 
        view 
        returns (
            string memory name,
            string memory rollNumber,
            uint256 marks,
            uint256 issueDate,
            address issuer,
            bool isValid
        ) 
    {
        Certificate memory cert = certificates[_certificateId];
        return (
            cert.name,
            cert.rollNumber,
            cert.marks,
            cert.issueDate,
            cert.issuer,
            cert.exists
        );
    }
    
    // Function to check if certificate exists
    function certificateExists(string memory _certificateId) public view returns (bool) {
        return certificates[_certificateId].exists;
    }
}
