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

/** Value stored in `creator_wallets.network` for receiving wallets. */
export const RECEIVING_NETWORK = "arc-testnet";

/** Human-readable label for the active network. */
export const RECEIVING_NETWORK_LABEL = ACTIVE_CHAIN.name;
