// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IIdentityRegistry
 * @dev Interface for the Identity Registry as defined in ERC-XXXX Trustless Agents v0.3
 * @notice This contract serves as the central registry for all agent identities
 */
interface IIdentityRegistry {
    // ============ Events ============
    
    /**
     * @dev Emitted when a new agent is registered
     */
    event AgentRegistered(uint256 indexed agentId, string agentDomain, address agentAddress);
    
    /**
     * @dev Emitted when an agent's information is updated
     */
    event AgentUpdated(uint256 indexed agentId, string agentDomain, address agentAddress);
    
    /**
     * @dev Emitted when an agent's TEE attestation is verified
     */
    event TEEAttestationVerified(uint256 indexed agentId, bytes32 indexed measurementHash);
    
    /**
     * @dev Emitted when an agent's domain is verified via RA-TLS
     */
    event DomainVerified(uint256 indexed agentId, bytes32 indexed rootPubKeyHash);

    // ============ Structs ============
    
    /**
     * @dev Agent information structure
     */
    struct AgentInfo {
        uint256 agentId;
        string agentDomain;
        address agentAddress;
        bytes32 teeMeasurementHash;  // TEE enclave measurement hash
        bool domainVerified;         // Whether domain is verified via RA-TLS
        bytes32 rootPubKeyHash;      // Hash of the root public key for domain verification
    }
    
    /**
     * @dev TEE attestation data structure
     */
    struct TEEAttestation {
        bytes32 measurementHash;     // TEE enclave measurement
        bytes attestationProof;      // TEE attestation proof/quote
        uint256 timestamp;           // Attestation timestamp
        bool verified;               // Whether attestation is verified
    }

    // ============ Errors ============
    
    error AgentNotFound();
    error UnauthorizedUpdate();
    error InvalidDomain();
    error InvalidAddress();
    error InsufficientFee();
    error DomainAlreadyRegistered();
    error AddressAlreadyRegistered();
    error InvalidTEEAttestation();
    error TEEAttestationAlreadyExists();
    error InvalidMeasurementHash();
    error DomainVerificationFailed();
    error InvalidRootPubKey();

    // ============ Write Functions ============
    
    /**
     * @dev Register a new agent
     * @param agentDomain The domain where the agent's AgentCard is hosted
     * @param agentAddress The EVM address of the agent
     * @return agentId The unique identifier assigned to the agent
     * @notice Requires 0.005 ETH fee which is burned
     */
    function newAgent(string calldata agentDomain, address agentAddress) external payable returns (uint256 agentId);
    
    /**
     * @dev Register a new agent with TEE attestation
     * @param agentDomain The domain where the agent's AgentCard is hosted
     * @param agentAddress The EVM address of the agent
     * @param measurementHash The TEE enclave measurement hash
     * @param attestationProof The TEE attestation proof/quote
     * @return agentId The unique identifier assigned to the agent
     * @notice Requires 0.005 ETH fee which is burned
     */
    function newAgentWithTEE(
        string calldata agentDomain,
        address agentAddress,
        bytes32 measurementHash,
        bytes calldata attestationProof
    ) external payable returns (uint256 agentId);
    
    /**
     * @dev Verify domain ownership via RA-TLS certificate
     * @param agentId The agent's unique identifier
     * @param rootPubKeyHash Hash of the root public key used for verification
     * @param certificateProof Proof of certificate ownership
     * @return success True if domain verification was successful
     */
    function verifyDomain(
        uint256 agentId,
        bytes32 rootPubKeyHash,
        bytes calldata certificateProof
    ) external returns (bool success);
    
    /**
     * @dev Update an existing agent's information
     * @param agentId The agent's unique identifier
     * @param newAgentDomain New domain (empty string to keep current)
     * @param newAgentAddress New address (zero address to keep current)
     * @return success True if update was successful
     * @notice Only callable by the agent's current address or authorized delegate
     */
    function updateAgent(
        uint256 agentId, 
        string calldata newAgentDomain, 
        address newAgentAddress
    ) external returns (bool success);

    // ============ Read Functions ============
    
    /**
     * @dev Get agent information by ID
     * @param agentId The agent's unique identifier
     * @return agentInfo The agent's information
     */
    function getAgent(uint256 agentId) external view returns (AgentInfo memory agentInfo);
    
    /**
     * @dev Resolve agent by domain
     * @param agentDomain The agent's domain
     * @return agentInfo The agent's information
     */
    function resolveByDomain(string calldata agentDomain) external view returns (AgentInfo memory agentInfo);
    
    /**
     * @dev Resolve agent by address
     * @param agentAddress The agent's address
     * @return agentInfo The agent's information
     */
    function resolveByAddress(address agentAddress) external view returns (AgentInfo memory agentInfo);
    
    /**
     * @dev Get the total number of registered agents
     * @return count The total count of registered agents
     */
    function getAgentCount() external view returns (uint256 count);
    
    /**
     * @dev Check if an agent ID exists
     * @param agentId The agent ID to check
     * @return exists True if the agent exists
     */
    function agentExists(uint256 agentId) external view returns (bool exists);
    
    /**
     * @dev Get TEE attestation data for an agent
     * @param agentId The agent's unique identifier
     * @return attestation The TEE attestation data
     */
    function getTEEAttestation(uint256 agentId) external view returns (TEEAttestation memory attestation);
    
    /**
     * @dev Check if an agent has verified TEE attestation
     * @param agentId The agent's unique identifier
     * @return hasAttestation True if agent has verified TEE attestation
     */
    function hasTEEAttestation(uint256 agentId) external view returns (bool hasAttestation);
    
    /**
     * @dev Check if an agent's domain is verified
     * @param agentId The agent's unique identifier
     * @return isVerified True if domain is verified via RA-TLS
     */
    function isDomainVerified(uint256 agentId) external view returns (bool isVerified);
    
    /**
     * @dev Get agents with the same TEE measurement hash
     * @param measurementHash The TEE measurement hash to search for
     * @return agentIds Array of agent IDs with the same measurement
     */
    function getAgentsByMeasurement(bytes32 measurementHash) external view returns (uint256[] memory agentIds);

    // ============ Constants ============
    
    /**
     * @dev Registration fee in wei (0.005 ETH)
     * @return fee The registration fee
     */
    function REGISTRATION_FEE() external pure returns (uint256 fee);
}