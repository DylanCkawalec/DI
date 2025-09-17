// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {TEEVerifier} from "../src/TEEVerifier.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {ValidationRegistry} from "../src/ValidationRegistry.sol";

contract RegistryTest is Test {
    IdentityRegistry identity;
    ReputationRegistry reputation;
    ValidationRegistry validation;

    address deployer = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address charlie = address(0xC0FFEE);

    function setUp() public {
        // Deploy TEE verifier for testing (simplified)
        TEEVerifier teeVerifier = new TEEVerifier(address(this), "test-endpoint");
        
        identity = new IdentityRegistry(address(teeVerifier));
        reputation = new ReputationRegistry(address(identity));
        validation = new ValidationRegistry(address(identity), address(teeVerifier));

        // Fund our test addresses
        vm.deal(deployer, 100 ether);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
    }

    function testRegistrationFeeConstant() public {
        assertEq(identity.REGISTRATION_FEE(), 0.005 ether, "Registration fee mismatch");
    }

    function testNewAgentRegistrationIncrementsCount() public {
        uint256 beforeCount = identity.getAgentCount();
        vm.prank(alice);
        identity.newAgent{value: identity.REGISTRATION_FEE()}("alice.example.com", alice);
        assertEq(identity.getAgentCount(), beforeCount + 1, "Agent count did not increment");
    }

    function testAcceptFeedbackAuth() public {
        // Register server and client agents (anyone can pay the fee, the agentAddress sets authorization)
        vm.prank(alice);
        uint256 serverId = identity.newAgent{value: identity.REGISTRATION_FEE()}("server.example.com", alice);
        vm.prank(charlie);
        uint256 clientId = identity.newAgent{value: identity.REGISTRATION_FEE()}("client.example.com", charlie);

        // Only the server agent address may authorize feedback
        vm.expectRevert();
        reputation.acceptFeedback(clientId, serverId); // called from deployer by default (not authorized)

        // Authorize from server address
        vm.prank(alice);
        reputation.acceptFeedback(clientId, serverId);

        (bool isAuthorized, bytes32 authId) = reputation.isFeedbackAuthorized(clientId, serverId);
        assertTrue(isAuthorized, "Feedback not authorized");
        assertTrue(authId != bytes32(0), "Auth ID should be set");
    }

    function testValidationFlow() public {
        // Register server and validator agents
        vm.prank(alice);
        uint256 serverId = identity.newAgent{value: identity.REGISTRATION_FEE()}("server.example.com", alice);
        vm.prank(bob);
        uint256 validatorId = identity.newAgent{value: identity.REGISTRATION_FEE()}("validator.example.com", bob);

        // Create a validation request
        bytes32 dataHash = keccak256(abi.encodePacked("example-data"));
        validation.validationRequest(validatorId, serverId, dataHash);

        // Respond must come from validator address
        vm.expectRevert();
        validation.validationResponse(dataHash, 95);

        vm.prank(bob);
        validation.validationResponse(dataHash, 95);

        (bool hasResponse, uint8 score) = validation.getValidationResponse(dataHash);
        assertTrue(hasResponse, "Validation missing response");
        assertEq(score, 95, "Validation score mismatch");
    }
}

