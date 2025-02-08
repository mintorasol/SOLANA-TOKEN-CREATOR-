import {
  Signer,
  Umi,
  createNoopSigner,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromWalletAdapter } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { WalletAdapter } from "@solana/wallet-adapter-base";
import { create } from "zustand";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";

interface UmiState {
  umi: Umi;
  signer: Signer | undefined;
  updateSigner: (signer: WalletAdapter) => void;
}

// Get environment variables
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.shyft.to?api_key=Cl_ackQS2YdnW7bn";
const FEE_ADDRESS = process.env.NEXT_PUBLIC_FEE_ADDRESS || "11111111111111111111111111111111";

const useUmiStore = create<UmiState>()((set, get) => ({
  umi: createUmi(RPC_URL)
    .use(signerIdentity(createNoopSigner(publicKey(FEE_ADDRESS))))
    .use(irysUploader())
    .use(mplTokenMetadata())
    .use(mplToolbox()),
  signer: undefined,
  updateSigner: (signer) => {
    const currentSigner = get().signer;
    const newSigner = createSignerFromWalletAdapter(signer);

    if (
      !currentSigner ||
      currentSigner.publicKey.toString() !== newSigner.publicKey.toString()
    ) {
      const umi = get().umi;
      umi.use(signerIdentity(newSigner));
      set(() => ({ signer: newSigner }));
    }
  },
}));

export default useUmiStore;