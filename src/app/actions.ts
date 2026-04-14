'use server';

import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import nodemailer from 'nodemailer';

// Initialize Nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string;
  const transactionId = formData.get('transactionId') as string;
  const email = formData.get('email') as string;

  try {
    // 1. Verify against verification_data
    const { data: verified, error: verifyError } = await supabase
      .from('verification_data')
      .select('*')
      .ilike('transaction_id', transactionId)
      .single();

    if (verifyError || !verified) {
      throw new Error('Invalid Transaction ID or Name. Please check your details.');
    }

    // Optional: Loose name matching (check if name is similar)
    if (!verified.name.toLowerCase().includes(name.toLowerCase().split(' ')[0])) {
      // throw new Error('Name does not match our records for this Transaction ID.');
    }

    // 2. Check if already registered
    const { data: existing } = await supabase
      .from('registrations')
      .select('*')
      .eq('transaction_id', verified.transaction_id)
      .single();

    if (existing) {
      throw new Error('A ticket has already been issued for this Transaction ID.');
    }

    // 3. Generate unique ticket ID (short & readable)
    const ticketId = `FW-${nanoid(4).toUpperCase()}`;

    // 4. Create Registration entry
    const { error: regError } = await supabase
      .from('registrations')
      .insert({
        name,
        email,
        transaction_id: verified.transaction_id,
        ticket_id: ticketId,
        status: 'pending'
      });

    if (regError) throw regError;

    // 5. Send Email via Gmail (Nodemailer)
    const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ticket/${ticketId}`;

    try {
      await transporter.sendMail({
        from: `Farewell Team <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your Farewell 2026 Ticket is Here!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h1 style="color: #0f172a; margin-bottom: 24px;">Hello ${name}!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
              Your payment has been verified. Here is your unique ticket for Farewell 2026.
            </p>
            
            <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 32px 0; border: 1px solid #e2e8f0;">
              <span style="display: block; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em; margin-bottom: 4px;">Ticket ID</span>
              <strong style="font-size: 32px; color: #2563eb;">${ticketId}</strong>
            </div>

            <p style="color: #475569; font-size: 14px;">
              You can view your digital ticket here: <a href="${ticketUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${ticketUrl}</a>
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
              This is an automated message. Please do not reply.
            </div>
          </div>
        `
      });
    } catch (e: any) {
      console.error('Nodemailer Error:', e);
      return { 
        success: true, 
        ticketId, 
        warning: 'Email failed: ' + (e.message || 'Check Gmail App Password.') 
      };
    }

    return { success: true, ticketId };
  } catch (err: any) {
    console.error('Registration Error:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function verifyTicket(ticketId: string) {
  try {
    // 1. Fetch ticket
    const { data: ticket, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (error || !ticket) {
      return { status: 'invalid', message: 'Invalid Ticket. ID not found.' };
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
    await transporter.sendMail({
      from: `Farewell Team <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: 'Test: Email Connection Working!',
      html: '<h1>Success!</h1><p>Your Gmail SMTP connection is working correctly.</p>'
    });

    return { success: true, message: 'Test email sent successfully via Gmail!' };
  } catch (err: any) {
    console.error('Gmail Test Error:', err);
    return { error: err.message || 'Failed to send test email.' };
  }
}
//harshjoshi