import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { GmailService } from "./gmail";

const gmailService = new GmailService();

// Tool to search emails
export const gmailSearch = tool(
  async (input: { query: string; maxResults?: number }) => {
    try {
      const emails = await gmailService.searchEmails(input.query, input.maxResults || 10);
      return JSON.stringify({
        success: true,
        count: emails.length,
        emails: emails.map(email => ({
          id: email.id,
          subject: email.subject,
          from: email.from,
          to: email.to,
          date: email.date,
          snippet: email.snippet,
        })),
        query: input.query,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        query: input.query,
      });
    }
  },
  {
    name: "gmail_search",
    description: "Search for emails in Gmail using Gmail search syntax. Examples: 'from:john@example.com', 'subject:meeting', 'is:unread', 'after:2024/01/01'",
    schema: z.object({
      query: z.string().describe("Gmail search query"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)"),
    }),
  }
);

// Tool to get recent emails
export const gmailGetRecent = tool(
  async (input: { maxResults?: number }) => {
    try {
      const emails = await gmailService.getRecentEmails(input.maxResults || 10);
      return JSON.stringify({
        success: true,
        count: emails.length,
        emails: emails.map(email => ({
          id: email.id,
          subject: email.subject,
          from: email.from,
          to: email.to,
          date: email.date,
          snippet: email.snippet,
        })),
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: "gmail_get_recent",
    description: "Get the most recent emails from Gmail inbox",
    schema: z.object({
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)"),
    }),
  }
);

// Tool to get unread emails
export const gmailGetUnread = tool(
  async (input: { maxResults?: number }) => {
    try {
      const emails = await gmailService.getUnreadEmails(input.maxResults || 10);
      return JSON.stringify({
        success: true,
        count: emails.length,
        emails: emails.map(email => ({
          id: email.id,
          subject: email.subject,
          from: email.from,
          to: email.to,
          date: email.date,
          snippet: email.snippet,
        })),
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: "gmail_get_unread",
    description: "Get unread emails from Gmail inbox",
    schema: z.object({
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)"),
    }),
  }
);

// Tool to get email by ID
export const gmailGetEmail = tool(
  async (input: { messageId: string }) => {
    try {
      const email = await gmailService.getEmailById(input.messageId);
      if (!email) {
        return JSON.stringify({
          success: false,
          error: 'Email not found',
          messageId: input.messageId,
        });
      }
      
      return JSON.stringify({
        success: true,
        email: {
          id: email.id,
          subject: email.subject,
          from: email.from,
          to: email.to,
          date: email.date,
          snippet: email.snippet,
          body: email.body,
        },
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: input.messageId,
      });
    }
  },
  {
    name: "gmail_get_email",
    description: "Get a specific email by its message ID",
    schema: z.object({
      messageId: z.string().describe("The Gmail message ID"),
    }),
  }
);

// Tool to send email
export const gmailSendEmail = tool(
  async (input: { to: string; subject: string; body: string; from?: string }) => {
    try {
      const result = await gmailService.sendEmail({
        to: input.to,
        subject: input.subject,
        body: input.body,
        from: input.from,
      });
      
      return JSON.stringify({
        success: result.success,
        messageId: result.messageId,
        to: input.to,
        subject: input.subject,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        to: input.to,
        subject: input.subject,
      });
    }
  },
  {
    name: "gmail_send_email",
    description: "Send an email through Gmail",
    schema: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content"),
      from: z.string().optional().describe("Sender email address (optional, uses default if not provided)"),
    }),
  }
);

// Tool to get emails from specific sender
export const gmailGetFromSender = tool(
  async (input: { sender: string; maxResults?: number }) => {
    try {
      const emails = await gmailService.getEmailsFromSender(input.sender, input.maxResults || 10);
      return JSON.stringify({
        success: true,
        count: emails.length,
        sender: input.sender,
        emails: emails.map(email => ({
          id: email.id,
          subject: email.subject,
          from: email.from,
          to: email.to,
          date: email.date,
          snippet: email.snippet,
        })),
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sender: input.sender,
      });
    }
  },
  {
    name: "gmail_get_from_sender",
    description: "Get emails from a specific sender",
    schema: z.object({
      sender: z.string().describe("Email address of the sender"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)"),
    }),
  }
);

// Tool to get user's email signature
export const gmailGetSignature = tool(
  async () => {
    try {
      const result = await gmailService.getEmailSignature();
      return JSON.stringify({
        success: result.success,
        signature: result.signature,
        error: result.error,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: "gmail_get_signature",
    description: "Get the user's Gmail signature that is automatically added to outgoing emails",
    schema: z.object({}),
  }
);

// Tool to send email with automatic signature
export const gmailSendEmailWithSignature = tool(
  async (input: { to: string; subject: string; body: string; from?: string }) => {
    try {
      const result = await gmailService.sendEmailWithSignature({
        to: input.to,
        subject: input.subject,
        body: input.body,
        from: input.from,
      });
      
      return JSON.stringify({
        success: result.success,
        messageId: result.messageId,
        to: input.to,
        subject: input.subject,
        note: "Email sent with automatic signature",
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        to: input.to,
        subject: input.subject,
      });
    }
  },
  {
    name: "gmail_send_email_with_signature",
    description: "Send an email through Gmail with the user's signature automatically added",
    schema: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content"),
      from: z.string().optional().describe("Sender email address (optional, uses default if not provided)"),
    }),
  }
);
