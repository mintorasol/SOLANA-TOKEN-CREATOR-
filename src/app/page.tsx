'use client'

import MintForm from '@/components/MintForm';
import Header from '@/components/header';
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Create star field
    const starField = document.createElement('div');
    starField.className = 'star-field';
    document.body.appendChild(starField);

    // Create stars with more density
    const createStars = (count: number, className: string) => {
      for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = `star ${className}`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        starField.appendChild(star);
      }
    };

    createStars(150, 'star-small');  // Increased from 100
    createStars(75, 'star-medium');  // Increased from 50
    createStars(35, 'star-large');   // Increased from 25

    return () => {
      document.body.removeChild(starField);
    };
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 bg-gradient-to-b from-[#060508] via-[#020203] to-black text-white relative overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-[#7C3AED] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-20 w-96 h-96 bg-[#EC4899] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-[#3B82F6] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob animation-delay-4000"></div>

        {/* Content Wrapper with additional gradient */}
        <div className="relative min-h-screen bg-gradient-to-b from-transparent via-[#060508]/50 to-black/80">
          <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="text-center mb-16 space-y-4">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#3B82F6] bg-clip-text text-transparent">
                Create Your Solana Token
              </h1>
              <h2 className="text-3xl text-white/90 font-light">
                in Minutes
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto text-lg">
                Launch your Solana token with zero coding required. Secure, fast, and
                customizable token creation platform for the next generation of crypto
                projects.
              </p>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto">
              <MintForm />
            </div>

            {/* Features Section */}
            <div id="features" className="scroll-mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                <div className="text-purple-400 text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Quick Launch</h3>
                <p className="text-gray-300">Create and deploy your token in minutes with our streamlined process.</p>
              </div>
              <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                <div className="text-purple-400 text-4xl mb-4">🛡️</div>
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Secure & Reliable</h3>
                <p className="text-gray-300">Built with security-first approach and audited smart contracts.</p>
              </div>
              <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                <div className="text-purple-400 text-4xl mb-4">💎</div>
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Token Standards</h3>
                <p className="text-gray-300">Compliant with all major Solana token standards and best practices.</p>
              </div>
            </div>

            {/* FAQ Section */}
            <div id="faq" className="scroll-mt-24 mt-20">
              <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-3 text-white">What is the Solana Token Creator?</h3>
                  <p className="text-gray-300">The Solana Token Creator is a user-friendly tool that allows you to create your own SPL tokens on the Solana blockchain in just a few simple steps—no coding required. It's perfect for beginners and experts alike.</p>
                </div>

                <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-3 text-white">Is it Safe to Create Solana Tokens Here?</h3>
                  <p className="text-gray-300">Yes, it's completely safe! Our platform uses secure, blockchain-based processes to ensure your tokens are created and delivered directly to your wallet. We do not store or access your private keys.</p>
                </div>

                <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-3 text-white">How much time will the Solana Token Creator Take?</h3>
                  <p className="text-gray-300">Creating a token takes less than 5 minutes! Once you complete the steps and confirm the transaction, your token will be ready in seconds.</p>
                </div>

                <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-3 text-white">Which wallet can I use?</h3>
                  <p className="text-gray-300">You can use any Solana-compatible wallet, such as Phantom, Solflare, or Trust Wallet. Simply connect your wallet to get started.</p>
                </div>

                <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-3 text-white">How many tokens can I create for each decimal amount?</h3>
                  <p className="text-gray-300">The total supply of tokens depends on the decimal amount you choose. For example: With 6 decimals, you can create up to 9,999,999,999,999,999 tokens (maximum supply). Adjust the decimal amount to fit your token's needs. We recommend using 6 decimals for most tokens.</p>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div id="contact" className="scroll-mt-24 mt-20 mb-12">
              <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Contact Us
              </h2>
              <div className="max-w-3xl mx-auto glass-effect rounded-2xl p-8 shadow-2xl">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold text-white">Get in Touch</h3>
                  <p className="text-gray-300">
                    Have questions or need support? Join our Telegram community for instant help and updates.
                  </p>
                  <div className="inline-block">
                    <a 
                      href="https://t.me/mintora_sol" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      <span className="text-lg">Join our Telegram</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
