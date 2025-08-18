import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '../../../lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, from, cc, bcc, isDraft } = body;

    if (!to && !isDraft) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    if (!subject && !isDraft) {
      return NextResponse.json(
        { success: false, error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!emailBody && !isDraft) {
      return NextResponse.json(
        { success: false, error: 'Email body is required' },
        { status: 400 }
      );
    }

    const gmailService = new GmailService();
    const result = await gmailService.sendEmailWithSignature({
      to,
      subject,
      body: emailBody,
      from,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending email with signature:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      },
      { status: 500 }
    );
  }
}
