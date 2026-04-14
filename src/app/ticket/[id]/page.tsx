import { supabase } from '@/lib/supabase';
import { TicketCard } from '@/components/TicketCard';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PrintButton } from '@/components/PrintButton';

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch ticket details from Supabase
  const { data: ticket, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('ticket_id', id)
    .single();

  if (error || !ticket) {
    notFound();
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
            Official Ticket
          </div>
        </div>

        <TicketCard name={ticket.name} ticketId={ticket.ticket_id} />

        <div className="mt-12 space-y-4">
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Event Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Event</span>
                <span className="font-medium">Farewell 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`font-medium ${ticket.status === 'checked_in' ? 'text-emerald-400' : 'text-primary'}`}>
                  {ticket.status === 'checked_in' ? 'Checked In' : 'Valid'}
                </span>
              </div>
            </div>
          </div>

          <PrintButton />
        </div>
      </div>
    </main>
  );
}
