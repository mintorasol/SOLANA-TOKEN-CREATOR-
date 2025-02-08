"use client"
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { Switch } from '@headlessui/react';
import useUmiStore from '@/store/useUmiStore';
import { createGenericFile } from '@metaplex-foundation/umi';
import { 
  generateSigner,
  percentAmount,
  some,
  none,
  publicKey as toPublicKey,
  Signer,
  sol,
} from '@metaplex-foundation/umi';
import { 
  createFungible,
  TokenStandard,
  mintV1,
  transferV1,
} from '@metaplex-foundation/mpl-token-metadata';
import { 
  transferSol, 
  findAssociatedTokenPda, 
  createMintWithAssociatedToken,
} from '@metaplex-foundation/mpl-toolbox';

// Environment variables
const FEE_ADDRESS = process.env.NEXT_PUBLIC_FEE_ADDRESS || "11111111111111111111111111111111";
const FEE_AMOUNT = Number(process.env.NEXT_PUBLIC_FEE_AMOUNT || "0.1");

// Add type declaration for window.solana
declare global {
  interface Window {
    solana: any;
  }
}

interface SocialLinks {
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
}

interface UploadProgress {
  status: 'idle' | 'uploading' | 'done' | 'error' | 'retrying';
  message: string;
  progress: number;
  retryCount?: number;
  error?: string;
}

// Add new interface for token data
interface TokenData {
  mint: string;
  metadata: string;
  tokenAddress: string;
}

export default function MintForm() {
  const { publicKey } = useWallet();
  const { umi } = useUmiStore();
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [initialSupply, setInitialSupply] = useState('');
  const [decimals, setDecimals] = useState('9'); // Default to 9 decimals
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [revokeMintAuthority, setRevokeMintAuthority] = useState(false);
  const [revokeFreezeAuthority, setRevokeFreezeAuthority] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    message: '',
    progress: 0
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    website: '',
    twitter: '',
    telegram: '',
    discord: ''
  });
  const [retryAttempts, setRetryAttempts] = useState(0);
  const MAX_RETRIES = 3;
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [tokenAccountAddress, setTokenAccountAddress] = useState<string>('');

  // Add retry delay utility
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Add retry wrapper function
  const withRetry = async <T,>(
    operation: () => Promise<T>,
    errorMessage: string,
    progressStart: number,
    progressEnd: number
  ): Promise<T | null> => {
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);
        
        if (attempts === MAX_RETRIES) {
          updateProgress('error', `${errorMessage} (${attempts} failed attempts)`, 0);
          throw error;
        }

        const backoffTime = Math.min(1000 * Math.pow(2, attempts), 10000);
        updateProgress(
          'retrying',
          `${errorMessage} - Retrying in ${backoffTime/1000}s (Attempt ${attempts + 1}/${MAX_RETRIES})`,
          progressStart
        );
        await delay(backoffTime);
      }
    }
    return null;
  };

  const handleSocialChange = (key: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please choose an image under 5MB.');
        return;
      }
      setTokenImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const updateProgress = (status: UploadProgress['status'], message: string, progress: number = 0) => {
    setUploadProgress({ status, message, progress });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !tokenImage) return;
    
    // Validate decimals
    const decimalValue = parseInt(decimals);
    if (isNaN(decimalValue) || decimalValue < 0 || decimalValue > 9) {
      alert('Decimals must be between 0 and 9');
      return;
    }

    // Validate initial supply
    if (!initialSupply || Number(initialSupply) <= 0) {
      alert('Initial supply must be greater than 0');
      return;
    }

    setIsLoading(true);
    setRetryAttempts(0);
    updateProgress('idle', 'Initializing upload...', 0);

    try {
      // Send fee payment first
      updateProgress('uploading', 'Processing fee payment...', 10);
      await withRetry(
        async () => {
          await transferSol(umi, {
            source: umi.identity,
            destination: toPublicKey(FEE_ADDRESS),
            amount: sol(FEE_AMOUNT),
          }).sendAndConfirm(umi);
        },
        'Error processing fee payment',
        10,
        20
      );

      // Upload image using Umi's Irys uploader
      updateProgress('uploading', 'Uploading image...', 20);
      
      const imageBuffer = await tokenImage.arrayBuffer();
      const genericFile = createGenericFile(
        new Uint8Array(imageBuffer),
        tokenImage.name,
        { contentType: tokenImage.type }
      );

      const imageUpload = await withRetry(
        async () => await umi.uploader.upload([genericFile]),
        'Error uploading image',
        20,
        40
      );

      if (!imageUpload || !imageUpload[0]) {
        throw new Error('Failed to upload image after multiple attempts');
      }

      const imageUrl = imageUpload[0];
      updateProgress('uploading', 'Creating metadata...', 40);

      // Create and upload metadata using Umi
      const metadata = {
        name: tokenName,
        symbol: tokenSymbol,
        description: description,
        image: imageUrl,
        properties: {
          files: [
            {
              uri: imageUrl,
              type: tokenImage.type,
            },
          ],
          socials: showSocials ? socialLinks : undefined
        },
      };

      const metadataUpload = await withRetry(
        async () => await umi.uploader.uploadJson(metadata),
        'Error uploading metadata',
        40,
        60
      );

      if (!metadataUpload) {
        throw new Error('Failed to upload metadata after multiple attempts');
      }

      updateProgress('uploading', 'Creating token...', 60);

      // Create token mint
      const mintKeypair = generateSigner(umi);
      const userPublicKey = toPublicKey(publicKey.toBase58());

      await withRetry(
        async () => {
          // First create mint with associated token account and initial supply
          updateProgress('uploading', 'Creating mint and token account...', 70);
          const mintAmount = BigInt(Number(initialSupply) * Math.pow(10, decimalValue));
          
          // Create mint and token account
          await createMintWithAssociatedToken(umi, {
            mint: mintKeypair,
            owner: userPublicKey,
            amount: mintAmount,
            decimals: decimalValue,
          }).sendAndConfirm(umi);

          // Then create the fungible token metadata
          updateProgress('uploading', 'Creating token metadata...', 80);
          await createFungible(umi, {
            mint: mintKeypair,
            authority: umi.identity,
            name: tokenName,
            symbol: tokenSymbol,
            uri: metadataUpload,
            sellerFeeBasisPoints: percentAmount(0),
            decimals: decimalValue,
            creators: some([{ address: umi.identity.publicKey, share: 100, verified: true }]),
            collection: none(),
            uses: none(),
            isMutable: true,
          }).sendAndConfirm(umi);

          // Get the token account address
          const tokenAccount = findAssociatedTokenPda(umi, {
            mint: mintKeypair.publicKey,
            owner: userPublicKey,
          });
          setTokenAccountAddress(tokenAccount.toString());

          // If requested, revoke mint authority
          if (revokeMintAuthority) {
            updateProgress('uploading', 'Revoking mint authority...', 90);
            // Implement mint authority revocation
            await transferV1(umi, {
              mint: mintKeypair.publicKey,
              authority: umi.identity,
              newAuthority: none(),
            }).sendAndConfirm(umi);
          }

          // If requested, revoke freeze authority
          if (revokeFreezeAuthority) {
            updateProgress('uploading', 'Revoking freeze authority...', 95);
            // Implement freeze authority revocation
            await transferV1(umi, {
              mint: mintKeypair.publicKey,
              authority: umi.identity,
              newAuthority: none(),
            }).sendAndConfirm(umi);
          }

          // Set the token data for display
          setTokenData({
            mint: mintKeypair.publicKey.toString(),
            metadata: metadataUpload,
            tokenAddress: tokenAccount.toString(),
          });
        },
        'Error creating token',
        60,
        100
      );

      updateProgress('done', 'Token created and minted successfully!', 100);
    } catch (error: unknown) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      updateProgress('error', `Error: ${errorMessage}`, 0);
    } finally {
      setIsLoading(false);
    }
  };

  // Update ProgressIndicator styling
  const ProgressIndicator = () => {
    if (uploadProgress.status === 'idle') return null;

    const bgColor = {
      uploading: 'bg-[#7C3AED]',
      retrying: 'bg-yellow-500',
      done: 'bg-green-500',
      error: 'bg-red-500'
    }[uploadProgress.status];

    return (
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className={`${uploadProgress.status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
            {uploadProgress.message}
          </span>
          <span className="text-gray-400">{uploadProgress.progress}%</span>
        </div>
        <div className="w-full bg-black/50 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${bgColor}`}
            style={{ width: `${uploadProgress.progress}%` }}
          />
        </div>
        {uploadProgress.status === 'error' && (
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
            className="mt-2 text-sm text-[#7C3AED] hover:text-[#EC4899] focus:outline-none transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="glass-effect rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-8 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">Token Details</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {!publicKey && (
            <div className="text-center py-4 mb-4">
              <p className="text-gray-400">Please connect your wallet to continue</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Name</label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[#7C3AED]/20 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white placeholder-gray-500 backdrop-blur-xl"
                placeholder="e.g. My Amazing Token"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Symbol</label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[#7C3AED]/20 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white placeholder-gray-500 backdrop-blur-xl"
                placeholder="e.g. MAT"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Initial Supply</label>
                <input
                  type="text"
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[#7C3AED]/20 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white placeholder-gray-500 backdrop-blur-xl"
                  placeholder="e.g. 1000000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Decimals
                  <span className="ml-2 text-xs text-gray-400">(0-9)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={decimals}
                  onChange={(e) => setDecimals(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[#7C3AED]/20 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white placeholder-gray-500 backdrop-blur-xl"
                  placeholder="e.g. 9"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Determines the divisibility of your token. Most tokens use 9 decimals.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[#7C3AED]/20 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white placeholder-gray-500 backdrop-blur-xl"
                placeholder="Describe your token and its purpose"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Logo</label>
              <div className="w-full flex justify-center px-6 pt-5 pb-6 border-2 border-[#7C3AED]/20 border-dashed rounded-xl bg-black/20 backdrop-blur-xl hover:border-[#7C3AED]/50 transition-colors">
                <div className="space-y-2 text-center">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 mx-auto">
                      <Image
                        src={imagePreview}
                        alt="Token preview"
                        fill
                        className="rounded-full object-cover ring-4 ring-[#7C3AED]/20"
                      />
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-purple-400 hover:text-purple-300"
                        >
                          <span>Click to upload logo</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleImageChange}
                            accept="image/*"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">(recommended size: 200x200)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl glass-effect">
            <div>
              <h3 className="text-sm font-medium text-white">Add Social Links</h3>
              <p className="text-xs text-gray-400">Include social media links for your token</p>
            </div>
            <Switch
              checked={showSocials}
              onChange={setShowSocials}
              className={`${
                showSocials ? 'bg-[#7C3AED]' : 'bg-gray-700'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
            >
              <span
                className={`${
                  showSocials ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          {showSocials && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">Social Links</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                  <input
                    type="url"
                    value={socialLinks.website}
                    onChange={(e) => handleSocialChange('website', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[#7C3AED]/20 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white placeholder-gray-500 backdrop-blur-xl"
                    placeholder="https://your-website.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Twitter</label>
                  <input
                    type="url"
                    value={socialLinks.twitter}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[#7C3AED]/20 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white placeholder-gray-500 backdrop-blur-xl"
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telegram</label>
                  <input
                    type="url"
                    value={socialLinks.telegram}
                    onChange={(e) => handleSocialChange('telegram', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[#7C3AED]/20 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white placeholder-gray-500 backdrop-blur-xl"
                    placeholder="https://t.me/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discord</label>
                  <input
                    type="url"
                    value={socialLinks.discord}
                    onChange={(e) => handleSocialChange('discord', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[#7C3AED]/20 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white placeholder-gray-500 backdrop-blur-xl"
                    placeholder="https://discord.gg/invite"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">Authority Options</h2>
            
            <div className="flex items-center justify-between p-4 rounded-xl glass-effect">
              <div>
                <h3 className="text-sm font-medium text-white">Revoke Mint Authority</h3>
                <p className="text-xs text-gray-400">Ensures no additional tokens can be minted (+0.05 SOL)</p>
              </div>
              <Switch
                checked={revokeMintAuthority}
                onChange={setRevokeMintAuthority}
                className={`${
                  revokeMintAuthority ? 'bg-[#7C3AED]' : 'bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
              >
                <span
                  className={`${
                    revokeMintAuthority ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl glass-effect">
              <div>
                <h3 className="text-sm font-medium text-white">Revoke Freeze Authority</h3>
                <p className="text-xs text-gray-400">Required for liquidity pools (+0.05 SOL)</p>
              </div>
              <Switch
                checked={revokeFreezeAuthority}
                onChange={setRevokeFreezeAuthority}
                className={`${
                  revokeFreezeAuthority ? 'bg-[#7C3AED]' : 'bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
              >
                <span
                  className={`${
                    revokeFreezeAuthority ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>

          <ProgressIndicator />

          <div className="pt-6">
            <button
              type="submit"
              disabled={!publicKey || isLoading || !tokenImage}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-custom hover:bg-gradient-custom-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-xl shadow-lg shadow-[#7C3AED]/20 ${
                !publicKey ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {!publicKey ? (
                'Connect Wallet to Continue'
              ) : isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {uploadProgress.message || 'Processing...'}
                </span>
              ) : (
                'Create Token'
              )}
            </button>
          </div>
        </form>
      </div>

      {tokenData && (
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
          <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">
            Token Created Successfully!
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mint Address</label>
              <div className="text-sm text-gray-400 break-all bg-black/20 p-3 rounded-lg">
                {tokenData.mint}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Metadata URI</label>
              <div className="text-sm text-gray-400 break-all bg-black/20 p-3 rounded-lg">
                {tokenData.metadata}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-400 glass-effect p-4 rounded-xl">
        Total Cost: {(FEE_AMOUNT + (revokeMintAuthority ? 0.05 : 0) + (revokeFreezeAuthority ? 0.05 : 0)).toFixed(3)} SOL
        <div className="mt-2 text-xs space-y-1">
          <div>Base Fee: {FEE_AMOUNT} SOL</div>
          {revokeMintAuthority && <div>Revoke Mint Authority: 0.05 SOL</div>}
          {revokeFreezeAuthority && <div>Revoke Freeze Authority: 0.05 SOL</div>}
        </div>
      </div>
    </div>
  );
} 