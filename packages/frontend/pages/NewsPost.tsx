import { Box, Container, Typography, Paper } from '@mui/material';

export interface NewsPost {
  id: string;
  date: string;
  title: string;
  content: string[];
}

interface NewsPostProps {
  post: NewsPost;
}

const NewsPost = ({ post }: NewsPostProps): JSX.Element => {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.02)',
          color: '#ffffff',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          },
        }}
      >
        <Box sx={{ p: { xs: 4, md: 8 } }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              mb: 4,
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {post.title}
          </Typography>
          
          <Typography
            sx={{
              fontSize: '1.1rem',
              mb: 6,
              color: '#a1a1aa',
              fontWeight: 400,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {post.date} • {Math.ceil(post.content.join(' ').split(' ').length / 200)} min read
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {post.content.map((paragraph, index) => (
              <Typography
                key={index}
                sx={{
                  lineHeight: 1.8,
                  color: '#a1a1aa',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 400,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {paragraph}
              </Typography>
            ))}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default NewsPost;
