%lang starknet

from contracts.verification.signature_storage import (
    add_trusted_signer_internal,
    trusted_signers
)

@contract
mod TestSignatureStorage:
    use starknet::testing::{start_test};
    use core::assert::*;

    #[test]
    fn test_store_and_read_trusted_signer() {
        let signer = 0x12345;
        let role = 0x2;
        let admin = 0x999;

        add_trusted_signer_internal(signer, role, admin);

        let (stored_role) = trusted_signers::trusted_signers::read(signer);
        assert(stored_role == role, 'Signer role should match stored value');
    }
end
