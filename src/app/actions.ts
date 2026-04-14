'use server';

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { nanoid } from 'nanoid';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string;
  const transactionId = formData.get('transactionId') as string;
  const email = formData.get('email') as string;

  if (!name || !transactionId || !email) {
    return { error: 'Please fill in all fields.' };
  }

  try {
    // 1. Check if Name/Transaction ID exists in verification_data
    const { data: verifiedUser, error: verifyError } = await supabase
      .from('verification_data')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (verifyError || !verifiedUser) {
      return { error: 'Transaction ID not found. Please contact support if you have paid.' };
    }

    // Optional: Check if the name matches (fuzzy or exact)
    if (verifiedUser.name.toLowerCase() !== name.toLowerCase()) {
      return { error: 'Name does not match the record for this Transaction ID.' };
    }

    // 2. Check if already registered
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (existingReg) {
      return { error: 'A ticket has already been issued for this Transaction ID.' };
    }

    // 3. Generate Unique Ticket ID
    // Short readable ID: FW-XXXX
    const ticketId = `FW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 4. Save Registration
    const { error: regError } = await supabase
      .from('registrations')
      .insert({
        name,
        email,
        transaction_id: transactionId,
        ticket_id: ticketId,
        status: 'pending'
      });

    if (regError) throw regError;

    // 5. Send Email via Resend
    const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ticket/${ticketId}`;
    
    try {
      const emailRes = await resend.emails.send({
        from: 'Farewell Team <onboarding@resend.dev>',
        to: email,
        subject: 'Your Farewell 2026 Ticket is Here!',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0f172a;">Hello ${name}!</h2>
            <p>Your payment has been verified. Here is your unique ticket for Farewell 2026.</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Ticket ID</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #38bdf8;">${ticketId}</p>
            </div>
            <p>You can view your digital ticket here: <a href="${ticketUrl}">${ticketUrl}</a></p>
          </div>
        `,
      });

      if (emailRes.error) {
        console.error('Resend Error:', emailRes.error);
        return { 
          success: true, 
          ticketId, 
          warning: 'Ticket created, but email failed. Resend error: ' + emailRes.error.message 
        };
      }
    } catch (e: any) {
      console.error('Email Exception:', e);
      return { success: true, ticketId, warning: 'Email system error. Please check your Resend API Key.' };
    }

    return { success: true, ticketId };
  } catch (err: any) {
    console.error('Registration Error:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function verifyTicket(ticketId: string) {
  try {
    // 1. Fetch ticket by ticket_id
    const { data: ticket, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (error || !ticket) {
      return { status: 'invalid', message: 'Ticket ID not found in database.' };
    }

    // 2. Scenario B: Already Checked In
    if (ticket.status === 'checked_in') {
      const time = new Date(ticket.checked_in_at).toLocaleTimeString();
      return { 
        status: 'duplicate', 
        message: `Duplicate Entry! Already checked in at ${time}.`,
        name: ticket.name
      };
    }

    // 3. Scenario A: Success - Mark as Checked In
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ 
        status: 'checked_in', 
        checked_in_at: new Date().toISOString() 
      })
      .eq('ticket_id', ticketId);

    if (updateError) throw updateError;

    return { 
      status: 'success', 
      message: 'Valid Ticket. Access Granted!',
      name: ticket.name
    };
  } catch (err: any) {
    return { status: 'error', message: err.message };
  }
}

export async function testResendConnection(toEmail: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Farewell Team <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Test: Email Connection Working!',
      html: '<h1>Success!</h1><p>Your Resend API connection is working correctly.</p>'
    });

    if (error) throw error;
    return { success: true, message: 'Test email sent successfully!' };
  } catch (err: any) {
    console.error('Email Test Error:', err);
    return { error: err.message || 'Failed to send test email.' };
  }
}
