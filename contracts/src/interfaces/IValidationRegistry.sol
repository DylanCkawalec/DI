// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IValidationRegistry
 * @dev Interface for the Validation Registry as defined in ERC-XXXX Trustless Agents v0.3
 * @notice This contract provides hooks for requesting and recording independent validation
 */
interface IValidationRegistry {
    // ============ Events ============
    
    /**
     * @dev Emitted when a validation request is made
     */
    event ValidationRequestEvent(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash
    );
    
    /**
     * @dev Emitted when a validation response is submitted
     */
    event ValidationResponseEvent(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash,
        uint8 response
    );
    
    /**
     * @dev Emitted when a TEE attestation validation is requested
     */
    event TEEValidationRequestEvent(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash,
        bytes32 measurementHash
    );
    
    /**
     * @dev Emitted when a TEE attestation validation is completed
     */
    event TEEValidationResponseEvent(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash,
        uint8 response,
        bool attestationValid
    );

    // ============ Structs ============
    
    /**
     * @dev Validation request structure
     */
    struct Request {
        uint256 agentValidatorId;
        uint256 agentServerId;
        bytes32 dataHash;
        uint256 timestamp;
        bool responded;
    }
    
    /**
     * @dev TEE validation request structure
     */
    struct TEEValidationRequest {
        uint256 agentValidatorId;
        uint256 agentServerId;
        bytes32 dataHash;
        bytes32 measurementHash;
        bytes attestationProof;
        uint256 timestamp;
        bool responded;
    }
    
    /**
     * @dev Validator type enumeration
     */
    enum ValidatorType {
        STANDARD,           // Standard crypto-economic validation
        TEE_ATTESTATION,    // TEE attestation verification
        ZK_PROOF           // Zero-knowledge proof verification
    }

    // ============ Errors ============
    
    error AgentNotFound();
    error ValidationRequestNotFound();
    error ValidationAlreadyResponded();
    error UnauthorizedValidator();
    error RequestExpired();
    error InvalidResponse();
    error InvalidDataHash();
    error InvalidTEEAttestation();
    error TEEValidationNotFound();
    error InvalidMeasurementHash();
    error UnsupportedValidatorType();

    // ============ Write Functions ============
    
    /**
     * @dev Submit a validation request
     * @param agentValidatorId The ID of the validator agent
     * @param agentServerId The ID of the server agent whose work needs validation
     * @param dataHash Hash of the data to be validated
     * @notice Creates a validation request that can be responded to by the validator
     */
    function validationRequest(
        uint256 agentValidatorId,
        uint256 agentServerId,
        bytes32 dataHash
    ) external;
    
    /**
     * @dev Submit a validation response
     * @param dataHash Hash of the data that was validated
     * @param response Validation score (0-100)
     * @notice Only callable by the designated validator agent's address
     */
    function validationResponse(bytes32 dataHash, uint8 response) external;

    // ============ Read Functions ============
    
    /**
     * @dev Get validation request details
     * @param dataHash The hash of the data being validated
     * @return request The validation request details
     */
    function getValidationRequest(bytes32 dataHash) external view returns (Request memory request);
    
    /**
     * @dev Check if a validation request exists and is pending
     * @param dataHash The hash of the data being validated
     * @return exists True if the request exists
     * @return pending True if the request is still pending response
     */
    function isValidationPending(bytes32 dataHash) external view returns (bool exists, bool pending);
    
    /**
     * @dev Get the validation response for a data hash
     * @param dataHash The hash of the validated data
     * @return hasResponse True if a response exists
     * @return response The validation score (0-100)
     */
    function getValidationResponse(bytes32 dataHash) external view returns (bool hasResponse, uint8 response);
    
    /**
     * @dev Get the expiration time for validation requests
     * @return slots Number of storage slots a request remains valid
     */
    function getExpirationSlots() external view returns (uint256 slots);
    
    /**
     * @dev Submit a TEE attestation validation request
     * @param agentValidatorId The ID of the TEE validator agent
     * @param agentServerId The ID of the server agent whose work needs validation
     * @param dataHash Hash of the data to be validated
     * @param measurementHash Expected TEE measurement hash
     * @param attestationProof TEE attestation proof/quote
     * @notice Creates a TEE-specific validation request
     */
    function teeValidationRequest(
        uint256 agentValidatorId,
        uint256 agentServerId,
        bytes32 dataHash,
        bytes32 measurementHash,
        bytes calldata attestationProof
    ) external;
    
    /**
     * @dev Submit a TEE attestation validation response
     * @param dataHash Hash of the data that was validated
     * @param response Validation score (0-100)
     * @param attestationValid Whether the TEE attestation is valid
     * @notice Only callable by the designated TEE validator agent's address
     */
    function teeValidationResponse(
        bytes32 dataHash, 
        uint8 response, 
        bool attestationValid
    ) external;
    
    /**
     * @dev Get TEE validation request details
     * @param dataHash The hash of the data being validated
     * @return request The TEE validation request details
     */
    function getTEEValidationRequest(bytes32 dataHash) external view returns (TEEValidationRequest memory request);
    
    /**
     * @dev Check if a TEE validation request exists and is pending
     * @param dataHash The hash of the data being validated
     * @return exists True if the request exists
     * @return pending True if the request is still pending response
     */
    function isTEEValidationPending(bytes32 dataHash) external view returns (bool exists, bool pending);
    
    /**
     * @dev Get validator type for an agent
     * @param agentId The validator agent ID
     * @return validatorType The type of validator
     */
    function getValidatorType(uint256 agentId) external view returns (ValidatorType validatorType);
    
    /**
     * @dev Set validator type for an agent
     * @param agentId The validator agent ID
     * @param validatorType The type of validator
     * @notice Only callable by the agent's registered address
     */
    function setValidatorType(uint256 agentId, ValidatorType validatorType) external;
}