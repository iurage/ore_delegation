#[macro_export]
macro_rules! mining_group_seeds {
    ($mining_group:expr) => {
        &[
            &$mining_group.unique_seed.to_le_bytes(),
            b"MiningGroup".as_ref(),
            &[$mining_group.bump],
        ]
    };
}

#[macro_export]
macro_rules! transfer_token_with_signer {
    ($accounts:expr, $from:expr, $to:expr, $authority:expr, $signer_seeds:expr, $amount:expr) => {
        token::transfer(
            CpiContext::new_with_signer(
                $accounts.token_program.to_account_info(),
                Transfer {
                    from: $from.to_account_info(),
                    to: $to.to_account_info(),
                    authority: $authority.to_account_info(),
                },
                $signer_seeds,
            ),
            $amount,
        )
    };
}

#[macro_export]
macro_rules! transfer_token {
    ($accounts:expr, $from:expr, $to:expr, $authority:expr, $amount:expr) => {
        token::transfer(
            CpiContext::new(
                $accounts.token_program.to_account_info(),
                Transfer {
                    from: $from.to_account_info(),
                    to: $to.to_account_info(),
                    authority: $authority.to_account_info(),
                },
            ),
            $amount,
        )
    };
}
