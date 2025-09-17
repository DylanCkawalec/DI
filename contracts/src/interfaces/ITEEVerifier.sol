// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ITEEVerifier
 * @dev Interface for TEE attestation verification and governance
 * @notice Provides cryptographically secure TEE attestation verification
 */
interface ITEEVerifier {
    // ============ Events ============
    
    event TrustedMeasurementAdded(bytes32 indexed measurementHash, string description);
    event TrustedMeasurementRemoved(bytes32 indexed measurementHash);
    event TrustedRootCAAdded(bytes32 indexed rootCAHash, address indexed authority);
    event TrustedRootCARemoved(bytes32 indexed rootCAHash);
    event AttestationVerified(bytes32 indexed quoteHash, bytes32 measurementHash, bool valid);
    event CertificateVerified(bytes32 indexed certHash, bytes32 rootCAHash, bool valid);

    // ============ Structs ============
    
    struct TEEQuote {
        bytes32 quoteHash;          // SHA256 of the full quote
        bytes32 measurementHash;    // MRTD from the quote
        bytes32 reportData;         // Report data from quote (user data)
        uint256 timestamp;          // Quote timestamp
        bytes signature;            // Quote signature
        bool verified;              // Verification status
    }
    
    struct TrustedMeasurement {
        bytes32 measurementHash;    // MRTD hash
        string description;         // Human-readable description
        uint256 addedAt;           // When it was added
        bool active;               // Whether it's currently trusted
    }
    
    struct TrustedRootCA {
        bytes32 rootCAHash;         // Hash of root CA public key
        address authority;          // Who added this CA
        uint256 addedAt;           // When it was added
        bool active;               // Whether it's currently trusted
    }

    // ============ Errors ============
    
    error InvalidQuote();
    error InvalidCertificate();
    error UntrustedMeasurement();
    error UntrustedRootCA();
    error QuoteExpired();
    error CertificateExpired();
    error InvalidSignature();
    error MeasurementAlreadyTrusted();
    error RootCAAlreadyTrusted();
    error OnlyGovernance();
    error InvalidReportData();

    // ============ Governance Functions ============
    
    /**
     * @dev Add a trusted TEE measurement (MRTD)
     * @param measurementHash The measurement hash to trust
     * @param description Human-readable description of the measurement
     * @notice Only governance can call this
     */
    function addTrustedMeasurement(bytes32 measurementHash, string calldata description) external;
    
    /**
     * @dev Remove a trusted TEE measurement
     * @param measurementHash The measurement hash to remove
     */
    function removeTrustedMeasurement(bytes32 measurementHash) external;
    
    /**
     * @dev Add a trusted root CA for RA-TLS verification
     * @param rootCAHash Hash of the root CA public key
     * @param authority The address that vouches for this CA
     */
    function addTrustedRootCA(bytes32 rootCAHash, address authority) external;
    
    /**
     * @dev Remove a trusted root CA
     * @param rootCAHash The root CA hash to remove
     */
    function removeTrustedRootCA(bytes32 rootCAHash) external;

    // ============ Verification Functions ============
    
    /**
     * @dev Verify a TEE attestation quote
     * @param quoteData The raw quote data from TEE
     * @param expectedReportData Expected report data to verify against
     * @param maxAge Maximum age of quote in seconds
     * @return verified Whether the quote is valid
     * @return measurementHash The measurement hash from the quote
     * @return quoteHash The hash of the quote for future reference
     */
    function verifyTEEQuote(
        bytes calldata quoteData,
        bytes32 expectedReportData,
        uint256 maxAge
    ) external returns (bool verified, bytes32 measurementHash, bytes32 quoteHash);
    
    /**
     * @dev Verify an RA-TLS certificate
     * @param certificateData The certificate data
     * @param domain The domain to verify against
     * @return verified Whether the certificate is valid
     * @return rootCAHash The root CA that signed this certificate
     */
    function verifyRATLSCertificate(
        bytes calldata certificateData,
        string calldata domain
    ) external returns (bool verified, bytes32 rootCAHash);
    
    /**
     * @dev Get verification status of a quote
     * @param quoteHash The quote hash to check
     * @return quote The quote information
     */
    function getQuoteVerification(bytes32 quoteHash) external view returns (TEEQuote memory quote);
    
    /**
     * @dev Check if a measurement is trusted
     * @param measurementHash The measurement to check
     * @return trusted Whether the measurement is trusted
     */
    function isTrustedMeasurement(bytes32 measurementHash) external view returns (bool trusted);
    
    /**
     * @dev Check if a root CA is trusted
     * @param rootCAHash The root CA to check
     * @return trusted Whether the root CA is trusted
     */
    function isTrustedRootCA(bytes32 rootCAHash) external view returns (bool trusted);
    
    /**
     * @dev Get all trusted measurements
     * @return measurements Array of trusted measurements
     */
    function getTrustedMeasurements() external view returns (TrustedMeasurement[] memory measurements);
}
