import { Box, Container, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export interface NewsPost {
  id: string;
  date: string;
  title: string;
  content: string[];
}

interface NewsPostProps {
  post: NewsPost;
  compact?: boolean;
}

const NewsPost = ({ post, compact = false }: NewsPostProps): JSX.Element => {
  const theme = useTheme();

  if (compact) {
    return (
      <Typography
        variant='h6'
        sx={{
          color: theme.palette.text.primary,
          cursor: 'pointer',
          '&:hover': {
            textDecoration: 'underline',
          }
        }}
      >
        {post.date} - {post.title}
      </Typography>
    );
  }

  return (
    <Container>
      <Box component="span" sx={{ display: 'inline-block', transform: 'scale(0.8)' }}>
        <Typography
          variant='h5'
          align='center'
          marginTop={theme.spacing(1)}
          gutterBottom
          sx={{ color: theme.palette.text.primary }}
        >
          {post.date} - {post.title}
        </Typography>

        {post.content.map((paragraph, index) => (
          <Typography
            key={index}
            variant='body1'
            align='left'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{ color: theme.palette.text.primary }}
          >
            {paragraph}
          </Typography>
        ))}
      </Box>
    </Container>
  );
};

export default NewsPost; 