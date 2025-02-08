'use client'

import dynamic from "next/dynamic";
import { useEffect, useState } from 'react';
import Image from "next/image";
import Link from 'next/link';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'glass-effect shadow-lg' : 'bg-gradient-to-b from-[#13111C]/80 to-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/assets/logo.png" height={50} width={50} alt="mintora Logo" className="hover:opacity-90 transition-opacity" />
              <span className="hidden sm:inline-block text-lg font-semibold text-white">mintora</span>
              <span className="px-2 py-1 rounded-full text-xs bg-gradient-to-r from-[#7C3AED]/20 to-[#EC4899]/20 text-[#7C3AED] border border-[#7C3AED]/20">
                Beta
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link>
              <Link href="https://raydium.io/liquidity/create/" target="_blank" className="text-gray-300 hover:text-white transition-colors">Create LP</Link>
              <Link href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <WalletMultiButtonDynamic />
            
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link>
              <Link href="https://raydium.io/liquidity/create/" target="_blank" className="text-gray-300 hover:text-white transition-colors">Create LP</Link>
              <Link href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
