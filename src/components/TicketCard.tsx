'use client';

import { QRCodeSVG } from 'qrcode.react';

interface TicketProps {
  name: string;
  ticketId: string;
}

export function TicketCard({ name, ticketId }: TicketProps) {
  const qrUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${ticketId}`;

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[1.6/1] glass overflow-hidden rounded-3xl border border-white/10 group animate-in fade-in zoom-in duration-500">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-colors" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 blur-3xl -ml-16 -mb-16 group-hover:bg-indigo-500/30 transition-colors" />

      {/* Ticket Contents */}
      <div className="relative h-full flex">
        {/* Left Side: Info */}
        <div className="flex-1 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">F</span>
              </div>
              <span className="font-bold tracking-widest text-xs opacity-50 uppercase">Farewell 2026</span>
            </div>
            <h3 className="text-3xl font-bold leading-none mb-1">{name}</h3>
            <p className="text-slate-400 text-sm font-medium tracking-wide">ADMIT ONE</p>
          </div>
          
          <div className="mt-auto">
            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Ticket ID</span>
            <span className="font-mono text-xl text-primary font-bold">{ticketId}</span>
          </div>
        </div>

        {/* Right Side: QR Code Area */}
        <div className="w-40 border-l border-white/10 flex flex-col items-center justify-center bg-white/5 p-6">
          <div className="bg-white p-2 rounded-xl">
            <QRCodeSVG value={qrUrl} size={110} />
          </div>
          <p className="text-[10px] mt-4 font-bold text-slate-400 tracking-tighter uppercase">Scan at Entry</p>
        </div>
      </div>
      
      {/* Ticket Perforation Decor */}
      <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background rounded-full -translate-y-1/2" />
      <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background rounded-full -translate-y-1/2" />
    </div>
  );
}
