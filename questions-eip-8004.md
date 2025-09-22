

Questions

Step
Questions
1) The Agent Server, after completing its work inside a TEE, stores the output, the attestation, and the inputs in a payload, and signs a transaction to the Validation Registry requesting validation by a specific Validator Agent.


As a developer, how do I set up the middleware? How much do I spend?
As a developer, how do I choose the infra? How much do I spend?
As a developer, what do I put in the payload (schema)? (This depends of the TEE technology)
2) The Validator Agent, which is listening to the chain, downloads the payload and verifies the attestation.
Do Validators already exist?
As a Validator, how can I listen to the Registry in an effective way?
What do I use to verify the attestation?
3) The Validator Agent creates a proof of the attestation verification.
What do I use to create the proof?
How much do I spend to create the proof?
What’s the proof size?


4) The Validator Agent posts the verification on-chain to a smart contract. 
How much does it cost to put it onchain? (gas)
What’s the connection between the way we generate the proof and the schema above? Do specific ways of generating proofs require specific schemas?
We have different TEEs techs. Do we also need different verifying contracts?
Are there already existing SC doing this?
Can we have just one SC per TEE tech or do we need to ask each Validator to deploy their own?
SC upgradability strategy
5) The verification of the proof occurs on-chain, and that same smart contract makes a sub-call to the 8004 Validation Registry, marking the validation as successfully completed.





