// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IIdentityRegistry.sol";
import "./interfaces/ITEEVerifier.sol";

/**
 * @title IdentityRegistry
 * @dev Implementation of the Identity Registry for ERC-XXXX Trustless Agents v0.3
 * @notice Central registry for all agent identities with spam protection
 * @author ChaosChain Labs
 */
contract IdentityRegistry is IIdentityRegistry {
    // ============ Constants ============
    
    /// @dev Registration fee of 0.005 ETH that gets burned
    uint256 public constant REGISTRATION_FEE = 0.005 ether;

    // ============ State Variables ============
    
    /// @dev Counter for agent IDs
    uint256 private _agentIdCounter;
    
    /// @dev Mapping from agent ID to agent info
    mapping(uint256 => AgentInfo) private _agents;
    
    /// @dev Mapping from domain to agent ID
    mapping(string => uint256) private _domainToAgentId;
    
    /// @dev Mapping from address to agent ID
    mapping(address => uint256) private _addressToAgentId;
    
    /// @dev Mapping from agent ID to TEE attestation data
    mapping(uint256 => IIdentityRegistry.TEEAttestation) private _teeAttestations;
    
    /// @dev Mapping from measurement hash to array of agent IDs
    mapping(bytes32 => uint256[]) private _measurementToAgents;
    
    /// @dev Mapping from measurement hash to whether it exists
    mapping(bytes32 => bool) private _measurementExists;
    
    /// @dev Reference to the TEE verifier for cryptographic validation
    ITEEVerifier public immutable teeVerifier;

    // ============ Constructor ============
    
    constructor(address _teeVerifier) {
        // Start agent IDs from 1 (0 is reserved for "not found")
        _agentIdCounter = 1;
        teeVerifier = ITEEVerifier(_teeVerifier);
    }

    // ============ Write Functions ============
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function newAgent(
        string calldata agentDomain, 
        address agentAddress
    ) external payable returns (uint256 agentId) {
        // Validate fee
        if (msg.value != REGISTRATION_FEE) {
            revert InsufficientFee();
        }
        
        // Validate inputs
        if (bytes(agentDomain).length == 0) {
            revert InvalidDomain();
        }
        if (agentAddress == address(0)) {
            revert InvalidAddress();
        }
        
        // Check for duplicates
        if (_domainToAgentId[agentDomain] != 0) {
            revert DomainAlreadyRegistered();
        }
        if (_addressToAgentId[agentAddress] != 0) {
            revert AddressAlreadyRegistered();
        }
        
        // Assign new agent ID
        agentId = _agentIdCounter++;
        
        // Store agent info
        _agents[agentId] = AgentInfo({
            agentId: agentId,
            agentDomain: agentDomain,
            agentAddress: agentAddress,
            teeMeasurementHash: bytes32(0),
            domainVerified: false,
            rootPubKeyHash: bytes32(0)
        });
        
        // Create lookup mappings
        _domainToAgentId[agentDomain] = agentId;
        _addressToAgentId[agentAddress] = agentId;
        
        // Burn the registration fee by not forwarding it anywhere
        // The ETH stays locked in this contract forever
        
        emit AgentRegistered(agentId, agentDomain, agentAddress);
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function updateAgent(
        uint256 agentId,
        string calldata newAgentDomain,
        address newAgentAddress
    ) external returns (bool success) {
        // Validate agent exists
        AgentInfo storage agent = _agents[agentId];
        if (agent.agentId == 0) {
            revert AgentNotFound();
        }
        
        // Check authorization
        if (msg.sender != agent.agentAddress) {
            revert UnauthorizedUpdate();
        }
        
        bool domainChanged = bytes(newAgentDomain).length > 0;
        bool addressChanged = newAgentAddress != address(0);
        
        // Validate new values if provided
        if (domainChanged) {
            if (_domainToAgentId[newAgentDomain] != 0) {
                revert DomainAlreadyRegistered();
            }
        }
        
        if (addressChanged) {
            if (_addressToAgentId[newAgentAddress] != 0) {
                revert AddressAlreadyRegistered();
            }
        }
        
        // Update domain if provided
        if (domainChanged) {
            // Remove old domain mapping
            delete _domainToAgentId[agent.agentDomain];
            // Set new domain
            agent.agentDomain = newAgentDomain;
            _domainToAgentId[newAgentDomain] = agentId;
        }
        
        // Update address if provided
        if (addressChanged) {
            // Remove old address mapping
            delete _addressToAgentId[agent.agentAddress];
            // Set new address
            agent.agentAddress = newAgentAddress;
            _addressToAgentId[newAgentAddress] = agentId;
        }
        
        emit AgentUpdated(agentId, agent.agentDomain, agent.agentAddress);
        return true;
    }

    // ============ Read Functions ============
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function getAgent(uint256 agentId) external view returns (AgentInfo memory agentInfo) {
        agentInfo = _agents[agentId];
        if (agentInfo.agentId == 0) {
            revert AgentNotFound();
        }
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function resolveByDomain(string calldata agentDomain) external view returns (AgentInfo memory agentInfo) {
        uint256 agentId = _domainToAgentId[agentDomain];
        if (agentId == 0) {
            revert AgentNotFound();
        }
        agentInfo = _agents[agentId];
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function resolveByAddress(address agentAddress) external view returns (AgentInfo memory agentInfo) {
        uint256 agentId = _addressToAgentId[agentAddress];
        if (agentId == 0) {
            revert AgentNotFound();
        }
        agentInfo = _agents[agentId];
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function getAgentCount() external view returns (uint256 count) {
        return _agentIdCounter - 1; // Subtract 1 because we start from 1
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function agentExists(uint256 agentId) external view returns (bool exists) {
        return _agents[agentId].agentId != 0;
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function newAgentWithTEE(
        string calldata agentDomain,
        address agentAddress,
        bytes32 measurementHash,
        bytes calldata attestationProof
    ) external payable returns (uint256 agentId) {
        // Validate fee
        if (msg.value != REGISTRATION_FEE) {
            revert InsufficientFee();
        }
        
        // Validate inputs
        if (bytes(agentDomain).length == 0) {
            revert InvalidDomain();
        }
        if (agentAddress == address(0)) {
            revert InvalidAddress();
        }
        if (measurementHash == bytes32(0)) {
            revert InvalidMeasurementHash();
        }
        if (attestationProof.length == 0) {
            revert InvalidTEEAttestation();
        }
        
        // Check for duplicates
        if (_domainToAgentId[agentDomain] != 0) {
            revert DomainAlreadyRegistered();
        }
        if (_addressToAgentId[agentAddress] != 0) {
            revert AddressAlreadyRegistered();
        }
        
        // CRITICAL: Verify TEE attestation cryptographically
        bytes32 expectedReportData = keccak256(abi.encodePacked(agentDomain, agentAddress));
        (bool verified, bytes32 verifiedMeasurement, bytes32 quoteHash) = teeVerifier.verifyTEEQuote(
            attestationProof,
            expectedReportData,
            3600 // Max 1 hour old quote
        );
        
        if (!verified) {
            revert InvalidTEEAttestation();
        }
        
        // Verify the measurement hash matches what was verified
        if (verifiedMeasurement != measurementHash) {
            revert InvalidMeasurementHash();
        }
        
        // Assign new agent ID
        agentId = _agentIdCounter++;
        
        // Store agent info with TEE data
        _agents[agentId] = AgentInfo({
            agentId: agentId,
            agentDomain: agentDomain,
            agentAddress: agentAddress,
            teeMeasurementHash: measurementHash,
            domainVerified: false,
            rootPubKeyHash: bytes32(0)
        });
        
        // Store cryptographically verified TEE attestation
        _teeAttestations[agentId] = IIdentityRegistry.TEEAttestation({
            measurementHash: measurementHash,
            attestationProof: attestationProof,
            timestamp: block.timestamp,
            verified: verified // Now actually verified!
        });
        
        // Create lookup mappings
        _domainToAgentId[agentDomain] = agentId;
        _addressToAgentId[agentAddress] = agentId;
        
        // Track agents by measurement hash
        _measurementToAgents[measurementHash].push(agentId);
        _measurementExists[measurementHash] = true;
        
        emit AgentRegistered(agentId, agentDomain, agentAddress);
        emit TEEAttestationVerified(agentId, measurementHash);
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function verifyDomain(
        uint256 agentId,
        bytes32 rootPubKeyHash,
        bytes calldata certificateProof
    ) external returns (bool success) {
        // Validate agent exists
        AgentInfo storage agent = _agents[agentId];
        if (agent.agentId == 0) {
            revert AgentNotFound();
        }
        
        // Check authorization
        if (msg.sender != agent.agentAddress) {
            revert UnauthorizedUpdate();
        }
        
        // Validate inputs
        if (rootPubKeyHash == bytes32(0)) {
            revert InvalidRootPubKey();
        }
        if (certificateProof.length == 0) {
            revert DomainVerificationFailed();
        }
        
        // CRITICAL: Verify RA-TLS certificate cryptographically
        (bool verified, bytes32 verifiedRootCA) = teeVerifier.verifyRATLSCertificate(
            certificateProof,
            agent.agentDomain
        );
        
        if (!verified) {
            revert DomainVerificationFailed();
        }
        
        // Verify the root CA hash matches what was provided
        if (verifiedRootCA != rootPubKeyHash) {
            revert InvalidRootPubKey();
        }
        
        // Now we can safely mark as verified
        agent.domainVerified = true;
        agent.rootPubKeyHash = rootPubKeyHash;
        
        emit DomainVerified(agentId, rootPubKeyHash);
        return true;
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function getTEEAttestation(uint256 agentId) external view returns (IIdentityRegistry.TEEAttestation memory attestation) {
        if (!this.agentExists(agentId)) {
            revert AgentNotFound();
        }
        attestation = _teeAttestations[agentId];
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function hasTEEAttestation(uint256 agentId) external view returns (bool hasAttestation) {
        if (!this.agentExists(agentId)) {
            return false;
        }
        return _teeAttestations[agentId].verified;
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function isDomainVerified(uint256 agentId) external view returns (bool isVerified) {
        if (!this.agentExists(agentId)) {
            return false;
        }
        return _agents[agentId].domainVerified;
    }
    
    /**
     * @inheritdoc IIdentityRegistry
     */
    function getAgentsByMeasurement(bytes32 measurementHash) external view returns (uint256[] memory agentIds) {
        return _measurementToAgents[measurementHash];
    }

    // ============ Internal Functions ============
    
    // Note: Registration fee is burned by keeping it locked in this contract
    // This is more gas-efficient than transferring to address(0)
}