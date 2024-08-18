import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

export const simulateAndAddComputeBudgetUnits = async (
  rpcEndpoint: string,
  tx: Transaction,
  multiplier: number,
  skip = false
) => {
  if (skip) return;
  tx.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 1_400_000,
    })
  );

  try {
    // Re-instantiate Connection within function to avoid type resolution issues
    // between web3.js versions used here and from caller.
    const simulationResults = await new Connection(
      rpcEndpoint,
      "processed"
    ).simulateTransaction(tx);
    const unitsConsumed = simulationResults.value.unitsConsumed;

    // Return error if simulation failed.
    if (simulationResults.value.err) return simulationResults.value.err;

    // Estimate new compute units based on simulation and cap at 1.4M.
    const computeUnits = Math.min(
      Math.floor(unitsConsumed * multiplier),
      1_400_000
    );

    // Remove earlier setComputeUnitLimit instruction and add new one with updated units.
    tx.instructions.pop();
    tx.instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnits,
      })
    );
  } catch (err) {
    console.error(err)
    const isTypeError = err
      .toString()
      .includes(
        "Cannot read properties of undefined (reading 'numRequiredSignatures')"
      );
    console.warn(
      "Failed to simulate transaction, defaulting to 1.4M CUs. " +
        (isTypeError
          ? "Please check that Transaction object has exact type as dsov-utils."
          : "")
    );
  }
};

interface FetchPriorityFeeParams {
  connection: Connection;
  multiplier?: number;
  max?: number;
  slots?: number;
  lockedWritableAccounts?: PublicKey[];
  log?: boolean;
}

/**
 * Fetches the estimated priority fee to use for a transaction on Solana.
 * It calculates the 85th percentile fee from recent slots, adjusts the fee with a multiplier,
 * and caps it at a maximum value.
 *
 * @param {FetchPriorityFeeParams} params - Parameters for fee calculation.
 * @returns {Promise<number>} Estimated priority fee in micro lamports.
 */
export const fetchPriorityFee = async ({
  connection,
  multiplier = 1,
  max = 200000,
  slots = 20,
  lockedWritableAccounts = [
    new PublicKey("8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6"),
  ],
  log = false,
}: FetchPriorityFeeParams): Promise<number> => {
  const fees = await connection.getRecentPrioritizationFees({
    lockedWritableAccounts,
  });

  // Calculate 85th percentile fee and average fee of most recent slots.
  const mostRecentSlot = fees.reduce((acc, fee) => Math.max(acc, fee.slot), 0);
  const recentFees = fees
    .filter((fee) => fee.slot >= mostRecentSlot - slots)
    .map((fee) => fee.prioritizationFee);
  recentFees.sort((a, b) => a - b);

  // 85th percentile Fee
  const percentile = Math.floor(recentFees.length * 0.85 - 1);
  const percentileFee = recentFees[percentile];

  // Average Fee
  const avgFee =
    recentFees.reduce((acc, fee) => acc + fee, 0) / recentFees.length;

  if (log) {
    console.log("85th percentile fee:", percentileFee);
    console.log("Average fee:", avgFee);
    console.log("Max fee", Math.max(...recentFees));
  }

  // Use average fee if percentile fee is 0.
  const selectedFee = percentileFee > 0 ? percentileFee : avgFee;

  return Math.floor(Math.min(selectedFee * multiplier, max));
};
