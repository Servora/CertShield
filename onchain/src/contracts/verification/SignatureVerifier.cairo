%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.starknet.common.syscalls import get_caller_address
from contracts.verification.signature_utils import (
    verify_ecdsa,
    verify_schnorr,
    is_signature_expired
)
from contracts.verification.signature_storage import (
    TrustedSigner,
    trusted_signers,
    add_trusted_signer_internal
)

@contract_interface
namespace IVerifier:
    func sign_certificate(cert_hash: felt, signature: felt*) -> ();
    func verify_signature(cert_hash: felt, signer: felt, signature: felt*) -> (valid: felt);
    func add_trusted_signer(signer: felt, role: felt) -> ();

end

@external
func verify_signature{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    cert_hash: felt, signer: felt, signature: felt*
) -> (valid: felt):
    let valid = verify_ecdsa(cert_hash, signer, signature)
    return (valid)
end

@external
func add_trusted_signer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    signer: felt, role: felt
):
    let caller = get_caller_address()
    add_trusted_signer_internal(signer, role, caller)
    return ()
end
