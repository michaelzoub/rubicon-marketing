/**
 * Network configuration for Rubicon.
 *
 * Transactions settle on Arc — starting on Arc Testnet. Arc is Circle's
 * USDC-native L1 (USDC is the gas token). The viem `arcTestnet` definition
 * matches Circle's published config (chain 5042002, rpc.testnet.arc.network,
 * ArcScan explorer).
 */
import { arcTestnet } from "viem/chains";

export { arcTestnet };

/** The chain the app currently operates on. Swap to Arc mainnet when ready. */
export const ACTIVE_CHAIN = arcTestnet;

/** CAIP-2 network identifier for the active chain (e.g. "eip155:5042002").
 *  Used to filter Circle Gateway x402 transfers by network. */
export const ACTIVE_CHAIN_CAIP2 = `eip155:${ACTIVE_CHAIN.id}`;

/** Value stored in `creator_wallets.network` for receiving wallets. */
export const RECEIVING_NETWORK = "arc-testnet";

/** Human-readable label for the active network. */
export const RECEIVING_NETWORK_LABEL = ACTIVE_CHAIN.name;
