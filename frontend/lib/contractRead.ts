// Read-only Soroban contract calls.
//
// Soroban has no plain "GET" for contract state — you build a transaction that
// calls the function and simulate it (run it without submitting or paying), and
// the simulation hands back the return value. This helper wraps that dance so
// the pages don't each hand-roll it (which is how the same source-account bug
// once ended up copy-pasted in two files).

import * as StellarSdk from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "./constants";

/**
 * Call a read-only contract method and return its decoded value.
 *
 * The simulation source is a throwaway random keypair: reads don't check or
 * charge the source, so it needs to be a valid key but nothing more — no real
 * identity, no funding.
 *
 * Returns the decoded value, or null when the method returned nothing (e.g. no
 * score stored for that wallet yet). Throws on an actual RPC/simulation error.
 */
export async function readContract(
  contractId: string,
  method: string,
  ...args: StellarSdk.xdr.ScVal[]
): Promise<unknown> {
  const server = new StellarSdk.rpc.Server(STELLAR_CONFIG.SOROBAN_RPC_URL);
  const contract = new StellarSdk.Contract(contractId);

  // Throwaway source — valid key, tied to no one, never funded.
  const source = new StellarSdk.Account(StellarSdk.Keypair.random().publicKey(), "0");

  const tx = new StellarSdk.TransactionBuilder(source, {
    fee: "100",
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error || "Simulation failed. Contract may not exist or the input is invalid.");
  }

  const retval = (sim as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  if (!retval) return null;

  return StellarSdk.scValToNative(retval);
}
