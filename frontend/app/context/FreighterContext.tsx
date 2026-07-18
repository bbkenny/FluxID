"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useToast } from "../components/Toast";

import {
  StellarWalletsKit,
  Networks,
} from "@creit.tech/stellar-wallets-kit";

import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";

// Initialize kit once outside component so it persists
let isKitInitialized = false;
function initKit() {
  if (typeof window === "undefined") return;
  if (!isKitInitialized) {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      selectedWalletId: "freighter",
      modules: [
        new FreighterModule(),
        new AlbedoModule(),
        new xBullModule()
      ],
    });
    isKitInitialized = true;
  }
}

interface WalletState {
  isInstalled: boolean;
  isConnected: boolean;
  publicKey: string | null;
  isLoading: boolean;
  error: string | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  getKit: () => typeof StellarWalletsKit;
}

const initialState: WalletState = {
  isInstalled: true, 
  isConnected: false,
  publicKey: null,
  isLoading: false,
  error: null,
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function FreighterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);
  const { showToast } = useToast();

  useEffect(() => {
    initKit();
  }, []);

  const connect = useCallback(async () => {
    try {
      initKit();
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { address } = await StellarWalletsKit.authModal();
      
      setState({
        isInstalled: true,
        isConnected: true,
        publicKey: address,
        isLoading: false,
        error: null,
      });
      showToast(`Connected to wallet`, "success");
    } catch (err: any) {
      console.error("Wallet selection error:", err);
      let errMsg = err.message || "Failed to connect to wallet.";
      
      if (errMsg.toLowerCase().includes("reject") || errMsg.toLowerCase().includes("decline") || errMsg.toLowerCase().includes("cancel")) {
        errMsg = "Wallet connection rejected by user.";
      } else if (errMsg.toLowerCase().includes("not found") || errMsg.toLowerCase().includes("not installed")) {
        errMsg = `Wallet is not installed or not found.`;
      }
      
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errMsg,
      }));
      showToast(errMsg, "error");
    }
  }, [showToast]);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {
      // ignore
    }
    setState({
      isInstalled: true,
      isConnected: false,
      publicKey: null,
      isLoading: false,
      error: null,
    });
    showToast("Wallet disconnected", "success");
  }, [showToast]);

  const getKit = useCallback(() => {
    initKit();
    return StellarWalletsKit;
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, getKit }}>
      {children}
    </WalletContext.Provider>
  );
}

// Keep the useFreighter name so we don't have to refactor everything
export function useFreighter(): WalletContextValue {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useFreighter must be used within a <FreighterProvider>");
  }
  return context;
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address || address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}
