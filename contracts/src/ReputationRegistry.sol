// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IReputationRegistry.sol";
import "./interfaces/IIdentityRegistry.sol";

/**
 * @title ReputationRegistry
 * @dev Implementation of the Reputation Registry for ERC-XXXX Trustless Agents v0.3
 * @notice Lightweight entry point for task feedback between agents
 * @author ChaosChain Labs
 */
contract ReputationRegistry is IReputationRegistry {
    // ============ State Variables ============
    
    /// @dev Reference to the IdentityRegistry for agent validation
    IIdentityRegistry public immutable identityRegistry;
    
    /// @dev Mapping from feedback auth ID to whether it exists
    mapping(bytes32 => bool) private _feedbackAuthorizations;
    
    /// @dev Mapping from client-server pair to feedback auth ID
    mapping(uint256 => mapping(uint256 => bytes32)) private _clientServerToAuthId;
    
    /// @dev Mapping from feedback auth ID to TEE requirement
    mapping(bytes32 => bool) private _requiresTEEVerification;
    
    /// @dev Mapping from feedback auth ID to calculated weight
    mapping(bytes32 => uint256) private _feedbackWeights;

    // ============ Constructor ============
    
    /**
     * @dev Constructor sets the identity registry reference
     * @param _identityRegistry Address of the IdentityRegistry contract
     */
    constructor(address _identityRegistry) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    // ============ Write Functions ============
    
    /**
     * @inheritdoc IReputationRegistry
     */
    function acceptFeedback(uint256 agentClientId, uint256 agentServerId) external {
        // Validate that both agents exist
        if (!identityRegistry.agentExists(agentClientId)) {
            revert AgentNotFound();
        }
        if (!identityRegistry.agentExists(agentServerId)) {
            revert AgentNotFound();
        }
        
        // Get server agent info to check authorization
        IIdentityRegistry.AgentInfo memory serverAgent = identityRegistry.getAgent(agentServerId);
        
        // Only the server agent can authorize feedback
        if (msg.sender != serverAgent.agentAddress) {
            revert UnauthorizedFeedback();
        }
        
        // Check if feedback is already authorized
        bytes32 existingAuthId = _clientServerToAuthId[agentClientId][agentServerId];
        if (existingAuthId != bytes32(0)) {
            revert FeedbackAlreadyAuthorized();
        }
        
        // Generate unique feedback authorization ID
        bytes32 feedbackAuthId = _generateFeedbackAuthId(agentClientId, agentServerId);
        
        // Store the authorization
        _feedbackAuthorizations[feedbackAuthId] = true;
        _clientServerToAuthId[agentClientId][agentServerId] = feedbackAuthId;
        
        emit AuthFeedback(agentClientId, agentServerId, feedbackAuthId);
    }

    // ============ Read Functions ============
    
    /**
     * @inheritdoc IReputationRegistry
     */
    function isFeedbackAuthorized(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (bool isAuthorized, bytes32 feedbackAuthId) {
        feedbackAuthId = _clientServerToAuthId[agentClientId][agentServerId];
        isAuthorized = feedbackAuthId != bytes32(0) && _feedbackAuthorizations[feedbackAuthId];
    }
    
    /**
     * @inheritdoc IReputationRegistry
     */
    function getFeedbackAuthId(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (bytes32 feedbackAuthId) {
        feedbackAuthId = _clientServerToAuthId[agentClientId][agentServerId];
    }

    // ============ Internal Functions ============
    
    /**
     * @inheritdoc IReputationRegistry
     */
    function acceptTEEFeedback(
        uint256 agentClientId, 
        uint256 agentServerId,
        bool requireTEE
    ) external {
        // Validate that both agents exist
        if (!identityRegistry.agentExists(agentClientId)) {
            revert AgentNotFound();
        }
        if (!identityRegistry.agentExists(agentServerId)) {
            revert AgentNotFound();
        }
        
        // Get server agent info to check authorization
        IIdentityRegistry.AgentInfo memory serverAgent = identityRegistry.getAgent(agentServerId);
        
        // Only the server agent can authorize feedback
        if (msg.sender != serverAgent.agentAddress) {
            revert UnauthorizedFeedback();
        }
        
        // Check if feedback is already authorized
        bytes32 existingAuthId = _clientServerToAuthId[agentClientId][agentServerId];
        if (existingAuthId != bytes32(0)) {
            revert FeedbackAlreadyAuthorized();
        }
        
        // If TEE is required, verify both agents have TEE attestations
        if (requireTEE) {
            if (!identityRegistry.hasTEEAttestation(agentClientId)) {
                revert TEEAttestationRequired();
            }
            if (!identityRegistry.hasTEEAttestation(agentServerId)) {
                revert TEEAttestationRequired();
            }
        }
        
        // Generate unique feedback authorization ID
        bytes32 feedbackAuthId = _generateFeedbackAuthId(agentClientId, agentServerId);
        
        // Store the authorization
        _feedbackAuthorizations[feedbackAuthId] = true;
        _clientServerToAuthId[agentClientId][agentServerId] = feedbackAuthId;
        _requiresTEEVerification[feedbackAuthId] = requireTEE;
        
        // Calculate and store feedback weight
        (uint256 weight, bool teeVerified) = _calculateWeight(agentClientId, agentServerId);
        _feedbackWeights[feedbackAuthId] = weight;
        
        if (requireTEE) {
            // Get TEE measurement hash for the event
            IIdentityRegistry.TEEAttestation memory serverAttestation = identityRegistry.getTEEAttestation(agentServerId);
            emit TEEFeedbackAuthorized(agentClientId, agentServerId, feedbackAuthId, serverAttestation.measurementHash);
        } else {
            emit AuthFeedback(agentClientId, agentServerId, feedbackAuthId);
        }
        
        emit FeedbackWeightCalculated(feedbackAuthId, weight, teeVerified);
    }
    
    /**
     * @inheritdoc IReputationRegistry
     */
    function calculateFeedbackWeight(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (uint256 weight, bool teeVerified) {
        return _calculateWeight(agentClientId, agentServerId);
    }
    
    /**
     * @inheritdoc IReputationRegistry
     */
    function requiresTEEVerification(
        bytes32 feedbackAuthId
    ) external view returns (bool requiresTEE) {
        return _requiresTEEVerification[feedbackAuthId];
    }

    // ============ Internal Functions ============
    
    /**
     * @dev Calculate feedback weight based on TEE attestation status
     * @param agentClientId The client agent ID
     * @param agentServerId The server agent ID
     * @return weight The calculated weight (1-100)
     * @return teeVerified Whether both agents have verified TEE attestations
     */
    function _calculateWeight(
        uint256 agentClientId,
        uint256 agentServerId
    ) internal view returns (uint256 weight, bool teeVerified) {
        bool clientHasTEE = identityRegistry.hasTEEAttestation(agentClientId);
        bool serverHasTEE = identityRegistry.hasTEEAttestation(agentServerId);
        bool clientDomainVerified = identityRegistry.isDomainVerified(agentClientId);
        bool serverDomainVerified = identityRegistry.isDomainVerified(agentServerId);
        
        teeVerified = clientHasTEE && serverHasTEE;
        
        // Base weight
        weight = 10; // Base weight of 10%
        
        // Add weight for TEE attestations
        if (clientHasTEE) weight += 20; // +20% for client TEE
        if (serverHasTEE) weight += 20; // +20% for server TEE
        
        // Add weight for domain verification
        if (clientDomainVerified) weight += 15; // +15% for client domain verification
        if (serverDomainVerified) weight += 15; // +15% for server domain verification
        
        // Bonus for both having TEE + domain verification
        if (teeVerified && clientDomainVerified && serverDomainVerified) {
            weight += 20; // +20% bonus for full verification
        }
        
        // Cap at 100%
        if (weight > 100) weight = 100;
    }
    
    /**
     * @dev Generates a unique feedback authorization ID
     * @param agentClientId The client agent ID
     * @param agentServerId The server agent ID
     * @return feedbackAuthId The unique authorization ID
     */
    function _generateFeedbackAuthId(
        uint256 agentClientId,
        uint256 agentServerId
    ) private view returns (bytes32 feedbackAuthId) {
        // Include block timestamp and transaction hash for uniqueness
        feedbackAuthId = keccak256(
            abi.encodePacked(
                agentClientId,
                agentServerId,
                block.timestamp,
                block.difficulty, // Use block.difficulty for additional entropy
                tx.origin
            )
        );
    }
}