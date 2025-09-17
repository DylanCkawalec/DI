// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IReputationRegistry
 * @dev Interface for the Reputation Registry as defined in ERC-XXXX Trustless Agents v0.3
 * @notice This contract provides a lightweight entry point for task feedback between agents
 */
interface IReputationRegistry {
    // ============ Events ============
    
    /**
     * @dev Emitted when feedback is authorized for a client-server pair
     */
    event AuthFeedback(
        uint256 indexed agentClientId,
        uint256 indexed agentServerId,
        bytes32 indexed feedbackAuthId
    );
    
    /**
     * @dev Emitted when TEE-verified feedback is authorized
     */
    event TEEFeedbackAuthorized(
        uint256 indexed agentClientId,
        uint256 indexed agentServerId,
        bytes32 indexed feedbackAuthId,
        bytes32 measurementHash
    );
    
    /**
     * @dev Emitted when feedback weight is calculated based on TEE status
     */
    event FeedbackWeightCalculated(
        bytes32 indexed feedbackAuthId,
        uint256 weight,
        bool teeVerified
    );

    // ============ Errors ============
    
    error AgentNotFound();
    error UnauthorizedFeedback();
    error FeedbackAlreadyAuthorized();
    error InvalidAgentId();
    error TEEAttestationRequired();
    error InvalidTEEMeasurement();

    // ============ Write Functions ============
    
    /**
     * @dev Accept feedback authorization from a client agent
     * @param agentClientId The ID of the client agent who will provide feedback
     * @param agentServerId The ID of the server agent who will receive feedback
     * @notice This creates a unique authorization for the client to provide feedback
     * @notice Only callable by the server agent's registered address
     */
    function acceptFeedback(uint256 agentClientId, uint256 agentServerId) external;
    
    /**
     * @dev Accept feedback authorization with TEE verification requirement
     * @param agentClientId The ID of the client agent who will provide feedback
     * @param agentServerId The ID of the server agent who will receive feedback
     * @param requireTEE Whether to require TEE attestation for both agents
     * @notice This creates a unique authorization for TEE-verified feedback
     * @notice Only callable by the server agent's registered address
     */
    function acceptTEEFeedback(
        uint256 agentClientId, 
        uint256 agentServerId,
        bool requireTEE
    ) external;

    // ============ Read Functions ============
    
    /**
     * @dev Check if feedback is authorized for a client-server pair
     * @param agentClientId The client agent ID
     * @param agentServerId The server agent ID
     * @return isAuthorized True if feedback is authorized
     * @return feedbackAuthId The unique authorization ID if authorized
     */
    function isFeedbackAuthorized(
        uint256 agentClientId, 
        uint256 agentServerId
    ) external view returns (bool isAuthorized, bytes32 feedbackAuthId);
    
    /**
     * @dev Get the feedback authorization ID for a client-server pair
     * @param agentClientId The client agent ID
     * @param agentServerId The server agent ID
     * @return feedbackAuthId The unique authorization ID
     */
    function getFeedbackAuthId(
        uint256 agentClientId, 
        uint256 agentServerId
    ) external view returns (bytes32 feedbackAuthId);
    
    /**
     * @dev Calculate feedback weight based on TEE attestation status
     * @param agentClientId The client agent ID
     * @param agentServerId The server agent ID
     * @return weight The calculated weight (1-100) based on TEE status
     * @return teeVerified Whether both agents have verified TEE attestations
     */
    function calculateFeedbackWeight(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (uint256 weight, bool teeVerified);
    
    /**
     * @dev Check if feedback authorization requires TEE verification
     * @param feedbackAuthId The feedback authorization ID
     * @return requiresTEE Whether TEE verification is required
     */
    function requiresTEEVerification(
        bytes32 feedbackAuthId
    ) external view returns (bool requiresTEE);
}