import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useRef, useState } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface WorkspaceAssistantProps {
  documentActions?: {
    getInfo: () => any;
    getContent: () => string;
    setContent: (content: string) => boolean;
    insertContent: (content: string, position?: 'start' | 'end' | 'cursor') => boolean;
    replaceSelected: (content: string) => boolean;
  };
  imageActions?: {
    getInfo: () => any;
    getBase64: (filePath?: string) => Promise<string | null>;
    getDimensions: (filePath?: string) => Promise<{ width: number; height: number } | null>;
    analyze: (analysis: 'description' | 'metadata' | 'colors' | 'text') => Promise<any>;
  };
  pdfActions?: {
    getInfo: () => any;
    getMetadata: (filePath?: string) => Promise<any | null>;
  };
}

export default function WorkspaceAssistant({
  documentActions,
  imageActions,
  pdfActions
}: WorkspaceAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your workspace assistant. I can help you with documents, images, and other files. How can I assist you today?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const theme = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const getRecognition = () => {
    const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return null;
    if (!recognitionRef.current) {
      const rec = new SpeechRecognitionImpl();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      recognitionRef.current = rec;
    }
    return recognitionRef.current;
  };

  const startRecording = () => {
    const rec = getRecognition();
    if (!rec) return;
    let finalTranscript = '';
    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      const text = (finalTranscript || interim).trim();
      setInputValue(text);
    };
    rec.onend = () => {
      setIsRecording(false);
    };
    rec.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch {}
    }
    setIsRecording(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateMockResponse(inputValue, documentActions, imageActions, pdfActions),
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateMockResponse = (
    input: string,
    docActions?: any,
    imgActions?: any,
    pdfActions?: any
  ): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('document') || lowerInput.includes('edit') || lowerInput.includes('write')) {
      if (docActions) {
        const docInfo = docActions.getInfo();
        if (docInfo.hasDocument) {
          return `I can see you have "${docInfo.fileName}" open. I can help you edit, format, or analyze this document. What would you like me to do?`;
        }
      }
      return 'I can help you with document editing and creation. Please open a document first, then I can assist with editing, formatting, or content suggestions.';
    }

    if (lowerInput.includes('image') || lowerInput.includes('picture') || lowerInput.includes('photo')) {
      if (imgActions) {
        const imgInfo = imgActions.getInfo();
        if (imgInfo.hasImage) {
          return `I can see you have "${imgInfo.fileName}" open. I can analyze this image, extract information, or help you understand its contents.`;
        }
      }
      return 'I can help analyze images and extract information from them. Please open an image file first.';
    }

    if (lowerInput.includes('pdf')) {
      if (pdfActions) {
        const pdfInfo = pdfActions.getInfo();
        if (pdfInfo.hasPdf) {
          return `I can see you have "${pdfInfo.fileName}" open. I can help extract information or summarize the PDF content.`;
        }
      }
      return 'I can help with PDF analysis and content extraction. Please open a PDF file first.';
    }

    if (lowerInput.includes('help')) {
      return 'I can assist you with:\n• Document editing and formatting\n• Image analysis and information extraction\n• PDF content analysis\n• File organization\n• General workspace tasks\n\nJust open a file and ask me what you need!';
    }

    return 'I understand you want to work with your files. Please open a document, image, or PDF, and I\'ll be able to provide more specific assistance based on what you\'re working with.';
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          AI Assistant
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip
            label="Documents"
            size="small"
            color={documentActions ? 'primary' : 'default'}
            variant={documentActions ? 'filled' : 'outlined'}
          />
          <Chip
            label="Images"
            size="small"
            color={imageActions ? 'primary' : 'default'}
            variant={imageActions ? 'filled' : 'outlined'}
          />
          <Chip
            label="PDFs"
            size="small"
            color={pdfActions ? 'primary' : 'default'}
            variant={pdfActions ? 'filled' : 'outlined'}
          />
        </Stack>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <List>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                px: 1,
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '80%',
                  backgroundColor:
                    message.role === 'user'
                      ? theme.palette.primary.main
                      : theme.palette.background.default,
                  color:
                    message.role === 'user'
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.primary,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  {message.role === 'assistant' ? (
                    <BotIcon fontSize="small" />
                  ) : (
                    <PersonIcon fontSize="small" />
                  )}
                  <Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.7,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </ListItem>
          ))}
          {isTyping && (
            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', px: 1 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.background.default,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BotIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    Typing...
                  </Typography>
                </Box>
              </Paper>
            </ListItem>
          )}
        </List>
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask me anything about your files..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            disabled={isTyping}
          />
          <IconButton
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTyping || !(typeof window !== 'undefined' && (((window as any).SpeechRecognition) || ((window as any).webkitSpeechRecognition)))}
            color={isRecording ? 'error' : 'default'}
            sx={{
              backgroundColor: isRecording ? theme.palette.error.main : theme.palette.action.hover,
              color: isRecording ? theme.palette.error.contrastText : theme.palette.text.primary,
              '&:hover': {
                backgroundColor: isRecording ? theme.palette.error.dark : theme.palette.action.selected,
              },
            }}
          >
            {isRecording ? 'Stop' : 'Mic'}
          </IconButton>
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            color="primary"
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              '&:disabled': {
                backgroundColor: theme.palette.action.disabledBackground,
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
