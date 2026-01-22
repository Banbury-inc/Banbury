import { extractEmailContent } from '../../../utils/emailUtils';

export const extractReplyBody = (email: any): string => {
  if (!email?.payload) return '';
  
  // Extract full email content
  const emailContent = extractEmailContent(email.payload);
  
  // Prefer HTML content if available, otherwise use text
  let body = emailContent.html || emailContent.text || email.snippet || '';
  
  // If we have HTML content, clean it up for reply formatting
  if (emailContent.html) {
    // Remove excessive styling but keep structure
    body = body
      .replace(/style="[^"]*"/g, '') // Remove inline styles
      .replace(/class="[^"]*"/g, '') // Remove classes
      .replace(/<div[^>]*>/g, '<p>') // Convert divs to paragraphs
      .replace(/<\/div>/g, '</p>') // Close paragraphs
      .replace(/<br\s*\/?>/g, '<br>') // Normalize line breaks
      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
      .replace(/<p><br><\/p>/g, '<br>') // Convert empty paragraphs to line breaks
      .trim();
  } else if (emailContent.text) {
    // For plain text, preserve line breaks
    body = emailContent.text
      .replace(/\n/g, '<br>') // Convert newlines to HTML line breaks
      .trim();
  }
  
  return body;
};
