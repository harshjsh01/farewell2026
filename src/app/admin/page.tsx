'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { testResendConnection } from '../actions';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle, Loader2, Table, Mail, RefreshCw, Trash2 } from 'lucide-react';

export default function AdminPage() {
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [testMailStatus, setTestMailStatus] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  useEffect(() => {
    fetchGuestList();
  }, []);

  async function fetchGuestList() {
    setLoadingData(true);
    const { data: list, error } = await supabase
      .from('verification_data')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (list) setData(list);
    setLoadingData(false);
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus({ type: null, message: '' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data: parsedData, errors } = results;

        if (errors.length > 0) {
          setStatus({ type: 'error', message: 'Error parsing CSV file.' });
          setUploading(false);
          return;
        }

        try {
          // Robust Header Detection
          const uniqueDataMap = new Map();
          let totalRows = parsedData.length;
          let invalidRows = 0;
          
          parsedData.forEach((row: any) => {
            const keys = Object.keys(row);
            
            // Flexible matching for Name
            const nameKey = keys.find(k => /name|student|guest|user/i.test(k));
            // Flexible matching for Transaction ID
            const tidKey = keys.find(k => /transaction|txn|id|ref|code/i.test(k));
            // Flexible matching for Payment Method
            const methodKey = keys.find(k => /method|payment|type|cash|online/i.test(k));

            const name = row[nameKey || '']?.toString().trim() || '';
            const tid = row[tidKey || '']?.toString().trim() || '';
            const method = row[methodKey || '']?.toString().trim() || 'Online';

            if (tid && name) {
              uniqueDataMap.set(tid, {
                name: name,
                transaction_id: tid,
                payment_method: method,
              });
            } else {
              invalidRows++;
            }
          });

          const formattedData = Array.from(uniqueDataMap.values());

          if (formattedData.length === 0) {
            setStatus({ type: 'error', message: `Found ${totalRows} rows, but none had valid Name & Transaction ID columns.` });
            setUploading(false);
            return;
          }

          const { error } = await supabase
            .from('verification_data')
            .upsert(formattedData, { onConflict: 'transaction_id' });

          if (error) throw error;

          const duplicateCount = totalRows - invalidRows - formattedData.length;
          setStatus({
            type: 'success',
            message: `Success: Loaded ${formattedData.length} entries. (Skipped ${invalidRows} empty and ${duplicateCount} duplicate rows).`,
          });
          fetchGuestList();
        } catch (err: any) {
          setStatus({ type: 'error', message: err.message || 'Failed to sync with database.' });
        } finally {
          setUploading(false);
        }
      },
    });
  };

  const handleTestEmail = async () => {
    setTestMailStatus('Sending test email...');
    const email = prompt('Enter your Resend registered email to test:');
    if (!email) {
      setTestMailStatus(null);
      return;
    }
    
    const res = await testResendConnection(email);
    if (res.error) {
      setTestMailStatus(`❌ Error: ${res.error}`);
    } else {
      setTestMailStatus(`✅ Success! Check ${email} (and Spam folder).`);
    }
  };

  const clearAllData = async () => {
    if (!confirm('Are you sure you want to delete ALL verification data?')) return;
    const { error } = await supabase.from('verification_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) alert(error.message);
    fetchGuestList();
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black gradient-text mb-2 tracking-tight">Admin Portal</h1>
            <p className="text-slate-400">Manage guest list and verify system health.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleTestEmail}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-sm font-bold transition-all"
            >
              <Mail className="w-4 h-4 text-primary" />
              Test Email System
            </button>
            <button 
              onClick={clearAllData}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 text-sm font-bold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </header>

        {testMailStatus && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold flex items-center justify-between">
            <span>{testMailStatus}</span>
            <button onClick={() => setTestMailStatus(null)} className="opacity-50 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <section className="glass rounded-3xl p-6 h-fit sticky top-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Guest List
              </h2>
              
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm font-medium">Processing CSV...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Upload className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-base font-bold text-slate-200">Select CSV file</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">CSV only</p>
                  </div>
                )}
              </div>

              {status.type && (
                <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
                  status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span className="text-sm font-bold leading-tight">{status.message}</span>
                </div>
              )}
            </section>
          </div>

          {/* Guest List Preview */}
          <div className="lg:col-span-2">
            <section className="glass rounded-3xl p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Table className="w-5 h-5 text-primary" />
                  Guest Database
                </h2>
                <button onClick={fetchGuestList} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                  <RefreshCw className={`w-4 h-4 text-slate-400 ${loadingData ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading Data...</span>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                  <p className="text-slate-500 mb-2">No guests uploaded yet.</p>
                  <p className="text-xs text-slate-600">Upload a CSV to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4 text-right">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5 transition-all group">
                          <td className="px-6 py-4 font-bold text-slate-200">{row.name}</td>
                          <td className="px-6 py-4 font-mono text-xs text-primary">{row.transaction_id}</td>
                          <td className="px-6 py-4 text-right text-slate-500 text-xs">{row.payment_method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
