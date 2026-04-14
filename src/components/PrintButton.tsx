'use client';

import { Download } from 'lucide-react';

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold"
    >
      <Download className="w-5 h-5" />
      Save Ticket as Image/PDF
    </button>
  );
}
