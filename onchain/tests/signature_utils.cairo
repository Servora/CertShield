%lang starknet

from contracts.verification.signature_utils import (
    verify_ecdsa,
    verify_schnorr,
    is_signature_expired
)

@contract
mod TestSignatureUtils:
    use starknet::testing::{start_test};
    use core::assert::*;

    #[test]
    fn test_ecdsa_signature_valid() {
        let cert_hash = 0xABCD;
        let signer = 0x1234;
        let signature = [0x1, 0x2];
        let (valid) = verify_ecdsa(cert_hash, signer, signature);
        assert(valid == 1, 'ECDSA verification failed');
    }

    #[test]
    fn test_schnorr_signature_valid() {
        let cert_hash = 0xAAAA;
        let signer = 0xBBBB;
        let signature = [0x3, 0x4];
        let (valid) = verify_schnorr(cert_hash, signer, signature);
        assert(valid == 1, 'Schnorr verification failed');
    }

    #[test]
    fn test_signature_expiry_check() {
        let current_time = 1000;
        let expiry = 900;
        let (expired) = is_signature_expired(current_time, expiry);
        assert(expired == 1, 'Should detect expired signature');

        let current_time = 800;
        let (expired) = is_signature_expired(current_time, expiry);
        assert(expired == 0, 'Should detect valid (non-expired) signature');
    }
end
