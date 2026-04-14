'use client';

import { useState } from 'react';
import { registerUser } from './actions';
import { TicketCard } from '@/components/TicketCard';
import { Loader2, Ticket, Sparkles, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    setUserName(name);

    const result = await registerUser(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.ticketId) {
      setTicketId(result.ticketId);
      if (result.warning) {
        setWarning(result.warning);
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden text-foreground">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#0f172a_100%)] -z-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -z-10 animate-pulse delay-700" />

      <AnimatePresence mode="wait">
        {!ticketId ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3 h-3" />
                <span>Farewell 2026</span>
              </div>
              <h1 className="text-5xl font-black gradient-text mb-4 tracking-tight">Get Your Ticket</h1>
              <p className="text-slate-400">Enter your details to verify your registration and receive your digital ticket.</p>
            </div>

            <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1">Transaction ID</label>
                <input
                  name="transactionId"
                  type="text"
                  required
                  placeholder="TXN12345678"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600 text-foreground"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Generate Ticket
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            
            <p className="text-center text-slate-500 text-xs mt-8 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Secure Payment Verification System
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="ticket"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center"
          >
            <div className="mb-8">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <Ticket className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Success!</h2>
              <p className="text-slate-400">Your ticket has been generated.</p>
            </div>

            {warning && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium text-left flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{warning}</span>
              </div>
            )}

            <TicketCard name={userName} ticketId={ticketId} />

            <button 
              onClick={() => window.print()}
              className="mt-10 text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Download or Print Ticket
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
