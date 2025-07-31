%lang starknet

from starknet.testing.contracts.signature_verifier import SignatureVerifier
from contracts.verification.signature_storage import trusted_signers

@contract
mod TestSignatureVerifier:
    use starknet::testing::{start_test};
    use core::assert::*;

    #[test]
    fn test_add_trusted_signer() {
        let contract = SignatureVerifier::deploy();

        let signer = 0x123;
        let role = 0x01;
        contract.add_trusted_signer(signer, role);

        let (stored_role) = trusted_signers::trusted_signers::read(signer);
        assert(stored_role == role, 'Trusted signer role should match');
    }

    #[test]
    fn test_verify_signature_ecdsa_valid() {
        let contract = SignatureVerifier::deploy();

        let cert_hash = 0xABC;
        let signer = 0x123;
        let signature = [0x1, 0x2];  // Simulated signature
        let (valid) = contract.verify_signature(cert_hash, signer, signature);

        assert(valid == 1, 'ECDSA signature should be valid');
    }
end
