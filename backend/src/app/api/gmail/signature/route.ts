import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '../../../lib/gmail';

export async function GET(request: NextRequest) {
  try {
    const gmailService = new GmailService();
    const result = await gmailService.getEmailSignature();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting Gmail signature:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get signature' 
      },
      { status: 500 }
    );
  }
}
