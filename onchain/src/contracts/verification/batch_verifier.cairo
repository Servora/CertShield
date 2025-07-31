%lang starknet

from contracts.verification.signature_utils import verify_ecdsa

@external
func batch_verify{syscall_ptr: felt*, pedersen_ptr, range_check_ptr}(
    certs_len: felt, certs: felt*, signers: felt*, signatures: felt*
) -> (success_count: felt):
    alloc_locals
    let success_count = 0
    # Loop over and call verify_ecdsa() — pseudocode
    return (success_count)
end
