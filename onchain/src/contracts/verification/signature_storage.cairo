%lang starknet

from starkware.starknet.common.storage import Storage
from starkware.starknet.common.syscalls import get_caller_address

struct TrustedSigner:
    signer: felt,
    role: felt

@storage_var
func trusted_signers(signer: felt) -> (role: felt):
end

func add_trusted_signer_internal(signer: felt, role: felt, caller: felt):
    # Optionally add owner/admin check here
    trusted_signers.write(signer, role)
    return ()
end
