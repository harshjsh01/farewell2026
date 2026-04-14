'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifyTicket } from '../actions';
import { CheckCircle2, XCircle, AlertTriangle, Camera, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ScanResult = {
  status: 'success' | 'duplicate' | 'invalid' | 'error' | null;
  message: string;
  name?: string;
};

export default function ScannerPage() {
  const [result, setResult] = useState<ScanResult>({ status: null, message: '' });
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const startScanner = () => {
      const element = document.getElementById('reader');
      if (isScanning && !scannerRef.current && element) {
        const scanner = new Html5QrcodeScanner(
          'reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      }
    };

    // Use a small timeout to ensure the DOM is fully ready
    const timer = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  async function onScanSuccess(decodedText: string) {
    // If it's a URL, extract the ID. If it's just the ID, use it.
    let ticketId = decodedText;
    if (decodedText.includes('/verify/')) {
      ticketId = decodedText.split('/verify/')[1];
    } else if (decodedText.includes('/ticket/')) {
      ticketId = decodedText.split('/ticket/')[1];
    }

    if (loading) return;
    
    // Stop scanning while processing
    setIsScanning(false);
    setLoading(true);

    try {
      const res = await verifyTicket(ticketId);
      setResult(res as ScanResult);
    } catch (err) {
      setResult({ status: 'error', message: 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  }

  function onScanFailure(error: any) {
    // Standard scanning attempts, usually ignore to prevent console spam
  }

  const resetScanner = () => {
    setResult({ status: null, message: '' });
    setIsScanning(true);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 ${
      result.status === 'success' ? 'bg-emerald-950' : 
      result.status === 'duplicate' ? 'bg-amber-950' : 
      result.status === 'invalid' ? 'bg-red-950' : 'bg-background'
    }`}>
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Entry Gatekeeper</h1>
          <p className="text-slate-400 text-sm">Scan QR Code to Verify Entry</p>
        </header>

        <main className="relative">
          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl overflow-hidden"
              >
                <div id="reader" className="w-full"></div>
                <div className="p-4 flex items-center justify-center gap-2 text-slate-400 bg-white/5">
                  <Camera className="w-4 h-4" />
                  <span className="text-xs font-medium">Align QR code within the box</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`glass p-10 rounded-3xl text-center border-2 ${
                  result.status === 'success' ? 'border-emerald-500' : 
                  result.status === 'duplicate' ? 'border-amber-500' : 'border-red-500'
                }`}
              >
                {loading ? (
                  <div className="py-10 flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="font-bold">Verifying Ticket...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 flex justify-center">
                      {result.status === 'success' && <CheckCircle2 className="w-24 h-24 text-emerald-500" />}
                      {result.status === 'duplicate' && <AlertTriangle className="w-24 h-24 text-amber-500" />}
                      {(result.status === 'invalid' || result.status === 'error') && <XCircle className="w-24 h-24 text-red-500" />}
                    </div>

                    <h2 className={`text-3xl font-black mb-2 uppercase tracking-tighter ${
                      result.status === 'success' ? 'text-emerald-400' : 
                      result.status === 'duplicate' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {result.status === 'success' ? 'Success' : 
                       result.status === 'duplicate' ? 'Duplicate' : 'Invalid'}
                    </h2>
                    
                    <p className="text-white text-lg font-medium mb-6">
                      {result.message}
                    </p>

                    {result.name && (
                      <div className="bg-white/10 rounded-xl p-4 mb-8">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Guest Name</span>
                        <span className="text-xl font-bold">{result.name}</span>
                      </div>
                    )}

                    <button
                      onClick={resetScanner}
                      className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Scan Next
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        <footer className="mt-12 text-center">
            <p className="text-xs text-slate-500 font-mono">STAFF ONLY ACCESS</p>
        </footer>
      </div>
    </div>
  );
}
