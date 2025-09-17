// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/TEEVerifier.sol";
import "../src/IdentityRegistry.sol";
import "../src/ReputationRegistry.sol";
import "../src/ValidationRegistry.sol";

/**
 * @title TEEEnhancementDemo
 * @dev Demonstration test for TEE-enhanced ERC-8004 functionality
 * @notice This test showcases the new TEE attestation features
 */
contract TEEEnhancementDemo is Test {
    IdentityRegistry identityRegistry;
    ReputationRegistry reputationRegistry;
    ValidationRegistry validationRegistry;
    
    address agentAddress1 = address(0x1);
    address agentAddress2 = address(0x2);
    address validatorAddress = address(0x3);
    
    bytes32 constant MEDICAL_TEE_MEASUREMENT = keccak256("medical-ai-tee-v1.0.0");
    bytes32 constant FINANCIAL_TEE_MEASUREMENT = keccak256("financial-ai-tee-v2.1.0");
    bytes32 constant ROOT_CA_HASH = keccak256("decentralized-root-ca-key");
    
    function setUp() public {
        // Deploy contracts with TEE support
        TEEVerifier teeVerifier = new TEEVerifier(address(this), "test-phala-endpoint");
        identityRegistry = new IdentityRegistry(address(teeVerifier));
        reputationRegistry = new ReputationRegistry(address(identityRegistry));
        validationRegistry = new ValidationRegistry(address(identityRegistry), address(teeVerifier));
        
        // Fund accounts
        vm.deal(agentAddress1, 1 ether);
        vm.deal(agentAddress2, 1 ether);
        vm.deal(validatorAddress, 1 ether);
    }
    
    function testTEEAgentRegistration() public {
        // Test 1: Register medical AI agent with TEE attestation
        vm.prank(agentAddress1);
        uint256 medicalAgentId = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "medical-ai.hospital.com",
            agentAddress1,
            MEDICAL_TEE_MEASUREMENT,
            abi.encodePacked("mock-tee-attestation-proof")
        );
        
        console.log("Medical Agent ID:", medicalAgentId);
        
        // Verify TEE attestation was recorded
        assertTrue(identityRegistry.hasTEEAttestation(medicalAgentId));
        
        IIdentityRegistry.TEEAttestation memory attestation = identityRegistry.getTEEAttestation(medicalAgentId);
        assertEq(attestation.measurementHash, MEDICAL_TEE_MEASUREMENT);
        assertTrue(attestation.verified);
        
        // Test 2: Register second medical agent with same measurement
        vm.prank(agentAddress2);
        uint256 medicalAgentId2 = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "medical-ai-2.hospital.com",
            agentAddress2,
            MEDICAL_TEE_MEASUREMENT, // Same measurement = trusted baseline
            abi.encodePacked("another-tee-attestation-proof")
        );
        
        // Verify both agents share the same measurement
        uint256[] memory agentsWithSameMeasurement = identityRegistry.getAgentsByMeasurement(MEDICAL_TEE_MEASUREMENT);
        assertEq(agentsWithSameMeasurement.length, 2);
        assertEq(agentsWithSameMeasurement[0], medicalAgentId);
        assertEq(agentsWithSameMeasurement[1], medicalAgentId2);
    }
    
    function testDomainVerification() public {
        // Register agent
        vm.prank(agentAddress1);
        uint256 agentId = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "secure-ai.example.com",
            agentAddress1,
            FINANCIAL_TEE_MEASUREMENT,
            abi.encodePacked("tee-proof")
        );
        
        // Verify domain with RA-TLS certificate
        vm.prank(agentAddress1);
        bool success = identityRegistry.verifyDomain(
            agentId,
            ROOT_CA_HASH,
            abi.encodePacked("ra-tls-certificate-proof")
        );
        
        assertTrue(success);
        assertTrue(identityRegistry.isDomainVerified(agentId));
        
        IIdentityRegistry.AgentInfo memory agentInfo = identityRegistry.getAgent(agentId);
        assertTrue(agentInfo.domainVerified);
        assertEq(agentInfo.rootPubKeyHash, ROOT_CA_HASH);
    }
    
    function testTEEValidation() public {
        // Setup agents
        vm.prank(agentAddress1);
        uint256 serverId = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "ai-server.example.com",
            agentAddress1,
            FINANCIAL_TEE_MEASUREMENT,
            abi.encodePacked("server-tee-proof")
        );
        
        vm.prank(validatorAddress);
        uint256 validatorId = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "validator.example.com",
            validatorAddress,
            keccak256("tee-validator-measurement"),
            abi.encodePacked("validator-tee-proof")
        );
        
        // Set validator type to TEE_ATTESTATION
        vm.prank(validatorAddress);
        validationRegistry.setValidatorType(validatorId, IValidationRegistry.ValidatorType.TEE_ATTESTATION);
        
        // Make TEE validation request
        bytes32 dataHash = keccak256("critical-ai-computation-data");
        validationRegistry.teeValidationRequest(
            validatorId,
            serverId,
            dataHash,
            FINANCIAL_TEE_MEASUREMENT,
            abi.encodePacked("computation-attestation-proof")
        );
        
        // Validator responds with attestation verification
        vm.prank(validatorAddress);
        validationRegistry.teeValidationResponse(dataHash, 100, true); // Perfect score, valid attestation
        
        // Verify response
        (bool hasResponse, uint8 response) = validationRegistry.getValidationResponse(dataHash);
        assertTrue(hasResponse);
        assertEq(response, 100);
    }
    
    function testTEEFeedbackWeighting() public {
        // Setup: Agent with full verification (TEE + domain)
        vm.prank(agentAddress1);
        uint256 clientId = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "client.example.com",
            agentAddress1,
            MEDICAL_TEE_MEASUREMENT,
            abi.encodePacked("client-tee-proof")
        );
        
        vm.prank(agentAddress1);
        identityRegistry.verifyDomain(clientId, ROOT_CA_HASH, abi.encodePacked("client-cert"));
        
        vm.prank(agentAddress2);
        uint256 serverId = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "server.example.com",
            agentAddress2,
            MEDICAL_TEE_MEASUREMENT,
            abi.encodePacked("server-tee-proof")
        );
        
        vm.prank(agentAddress2);
        identityRegistry.verifyDomain(serverId, ROOT_CA_HASH, abi.encodePacked("server-cert"));
        
        // Calculate feedback weight
        (uint256 weight, bool teeVerified) = reputationRegistry.calculateFeedbackWeight(clientId, serverId);
        
        console.log("Feedback weight for fully verified agents:", weight);
        assertTrue(teeVerified);
        assertEq(weight, 100); // Max weight: 10 + 20 + 20 + 15 + 15 + 20 = 100%
        
        // Test TEE feedback authorization
        vm.prank(agentAddress2);
        reputationRegistry.acceptTEEFeedback(clientId, serverId, true); // Require TEE
        
        (bool isAuthorized, bytes32 authId) = reputationRegistry.isFeedbackAuthorized(clientId, serverId);
        assertTrue(isAuthorized);
        assertTrue(reputationRegistry.requiresTEEVerification(authId));
    }
    
    function testPartialVerificationWeighting() public {
        // Setup: Client with TEE only, Server with domain only
        vm.prank(agentAddress1);
        uint256 clientId = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "partial-client.example.com",
            agentAddress1,
            FINANCIAL_TEE_MEASUREMENT,
            abi.encodePacked("client-tee-proof")
        );
        // No domain verification for client
        
        vm.prank(agentAddress2);
        uint256 serverId = identityRegistry.newAgent{value: 0.005 ether}(
            "partial-server.example.com",
            agentAddress2
        );
        
        vm.prank(agentAddress2);
        identityRegistry.verifyDomain(serverId, ROOT_CA_HASH, abi.encodePacked("server-cert"));
        
        // Calculate feedback weight
        (uint256 weight, bool teeVerified) = reputationRegistry.calculateFeedbackWeight(clientId, serverId);
        
        console.log("Feedback weight for partially verified agents:", weight);
        assertFalse(teeVerified); // Only client has TEE, not server
        assertEq(weight, 45); // Base(10) + Client TEE(20) + Server Domain(15) = 45%
    }
    
    function testAgentDiscoveryByMeasurement() public {
        bytes32 commonMeasurement = keccak256("standardized-ai-model-v1");
        
        // Register multiple agents with same measurement (same AI model)
        vm.prank(agentAddress1);
        uint256 agent1 = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "ai1.example.com",
            agentAddress1,
            commonMeasurement,
            abi.encodePacked("proof1")
        );
        
        vm.prank(agentAddress2);
        uint256 agent2 = identityRegistry.newAgentWithTEE{value: 0.005 ether}(
            "ai2.example.com",
            agentAddress2,
            commonMeasurement,
            abi.encodePacked("proof2")
        );
        
        // Discover all agents running the same AI model
        uint256[] memory sameModelAgents = identityRegistry.getAgentsByMeasurement(commonMeasurement);
        
        assertEq(sameModelAgents.length, 2);
        console.log("Found", sameModelAgents.length, "agents with same AI model measurement");
        
        // These agents can start with shared baseline reputation
        // since they're running identical, verified code
    }
}
