import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, Card, CardMedia, Container, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Recording from '../assets/images/Recording.mp4';
import Recording3 from '../assets/images/Recording3.mp4';
import { determineOS } from '../handlers/determineOS';


interface ProductsProps {
  name: string;
  description: string;
  image: string;
}

const Features = (): JSX.Element => {
  const theme = useTheme();
  const [products, setProducts] = useState<ProductsProps[]>([]);
  const [downloadText, setDownloadText] = useState<string>('Download');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  useEffect(() => {
    fetchProducts();
    determineOS(setDownloadText, setDownloadUrl);
  }, []);

  const fetchProducts = () => {
    axios.get<ProductsProps[]>('http://127.0.0.1:8000/products', {
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      setProducts(response.data);
    }).catch((error) => console.log(error));
  };






  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <div id='neuranet'>
      <Box
        sx={{
          paddingTop: 5,
          paddingBottom: 10,
          px: 2,
          backgroundColor: theme.palette.background.default,
          textAlign: 'center'
        }}
      >
        <Box
          marginBottom={4}
        >
          <Typography
            variant='h2'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            Your Files, Your Control
          </Typography>
          <Typography
            variant='subtitle1'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            color={theme.palette.text.secondary}
          >
            Decentralized Cloud Storage with AI-Powered Intelligence
          </Typography>
          <Typography
            variant='subtitle2'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            color={theme.palette.text.secondary}
          >
            Experience the future of file management. Secure, private, and intelligent storage that puts you in control of your data.

          </Typography>
        </Box>

        <Button variant="contained" onClick={handleDownload}
          sx={{
            borderRadius: '20px',
            marginBottom: '5rem'
          }}
        >
          {downloadText}
        </Button>




        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            margin: '0 auto',
            alignItems: 'center',
            width: '85%',
            maxWidth: '80%',
            background: 'linear-gradient(135deg, #e0f2ff 0%, #d5e6ff 100%)',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(100, 150, 255, 0.1)',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '80%',
              height: 'auto',
              borderRadius: '8px',
            }}
          >
            <source src={Recording} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </Box>


        <Box
          sx={{
            textAlign: 'center',
            marginTop: 14,
            marginBottom: 14
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary
            }}
          >
            Seamless File and Device Management
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: theme.palette.text.secondary,
              marginBottom: 14
            }}
          >
            Experience our intuitive interface designed for effortless organization, with AI-powered intelligence
            to help you manage your files and devices.
          </Typography>
        </Box>







        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            margin: '0 auto',
            alignItems: 'center',
            width: '85%',
            maxWidth: '80%',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFA07A 100%)',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(100, 150, 255, 0.1)',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '80%',
              height: 'auto',
              borderRadius: '8px',
            }}
          >
            <source src={Recording3} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </Box>



        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto',
            width: '85%',
            maxWidth: '80%',
            backgroundColor: theme.palette.background.paper,
            padding: '48px',
            borderRadius: '16px',
            marginTop: '5rem',
            gap: '24px'
          }}
        >
        </Box>

        <Container>
          <Grid container spacing={4}>
            {products.map((item, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Box
                  component={Card}
                  padding={4}
                  width={1}
                  height={1}
                  bgcolor={theme.palette.background.paper}
                  sx={{
                    '&:hover': {
                      bgcolor: theme.palette.background.default,
                      color: theme.palette.mode === 'dark'
                        ? theme.palette.common.white
                        : theme.palette.common.black,
                    },
                  }}
                >
                  <Box display='flex' flexDirection='column'>
                    <Typography
                      variant='h6'
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography color='inherit'>{item.description}</Typography>
                  </Box>
                  <Box display='block' width={1} height={1}>
                    <CardMedia
                      title=''
                      image={item.image}
                      sx={{
                        position: 'relative',
                        height: 320,
                        overflow: 'hidden',
                        borderRadius: 2,
                        filter: theme.palette.mode === 'dark'
                          ? 'brightness(0.7)'
                          : 'brightness(0.9)',
                        marginTop: 4,
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </div>
  );
};

export default Features;
