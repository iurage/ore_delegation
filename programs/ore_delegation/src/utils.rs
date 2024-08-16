use anchor_lang::prelude::*;

pub const BPS_DENOM: u64 = 10000_u64;
pub const BPS_DENOM_U16: u16 = 10000_u16;

/// Calculates the percentage amount of a given number, by applying the basis points.
/// If ceil is true, the result is rounded up to prevent precision loss.
///
/// Percentages are all based on `BPS_DENOM`, e.g. 100% = BPS_DENOM, 50% is half of
/// BPS_DENOM, and so forth.
/// TODO: Add Test Coverage
pub fn calculate_percentage_amount(amount: u64, bps: u16, ceil: bool) -> Result<u64> {
    let numerator = amount.checked_mul(u64::from(bps)).unwrap();
    let divisor = BPS_DENOM;

    // If ceil, add divisor-1 to numerator to enforce that floating point is
    // rounded up to prevent precision loss.
    let numerator = if ceil {
        numerator.checked_add(divisor - 1).unwrap()
    } else {
        numerator
    };

    let percentage_amount = numerator.checked_div(divisor).unwrap();
    Ok(percentage_amount)
}
