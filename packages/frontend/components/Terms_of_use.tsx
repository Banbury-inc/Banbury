import { Box, Card, CardMedia, Container, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { useState, useEffect } from 'react';


interface ProductsProps {
  name: string;
  description: string;
  image: string;
}

const Terms_of_use = (): JSX.Element => {
  const theme = useTheme();
  const [products, setProducts] = useState<ProductsProps[]>([]);

  useEffect(() => {
    fetchProducts();
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
        <Box marginBottom={4}>
          <Typography
            variant='h2'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            Terms of use
          </Typography>
          <Typography
            variant='subtitle1'
            align="center"
            marginTop={theme.spacing(1)}
            gutterBottom
            color={theme.palette.text.secondary}
          >
          </Typography>

          <Container>
            <Box component="span" sx={{ display: 'inline-block', transform: 'scale(0.8)' }}>
              <Typography
                variant='h5'
                align='left'
                marginTop={theme.spacing(1)}
                gutterBottom
                sx={{ color: theme.palette.text.primary, }}>
                {/* February 3, 2024 - Banbury Cloud Beta CLI Tool Released */}
              </Typography>

              <Typography
                variant='body1'
                align='left'
                marginTop={theme.spacing(1)}
                gutterBottom
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                Thank you for using Banbury products!
                <br />
                <br />
                These Terms of Use apply to your use of NeuraNet, Banbury Cloud and Banbury&apos;s other
                services for individuals, along with any associated software applications and websites
                (all together, &quot;Services&quot;). These Terms form an agreement between you and Banbury Innovations, Inc.,
                a Delaware company, and they include our Service Terms and important provisions for resolving
                disputes through arbitration. By using our Services, you agree to these Terms.
                <br />
                <br />
                If you reside in the European Economic Area, Switzerland, or the UK, your use of the Services is
                governed by these terms.
                <br />
                <br />
                Our Business Terms govern use of Banbury Cloud, our APIs, and our other services for businesses and developers.
                <br />
                <br />
                Our Privacy Policy explains how we collect and use personal information. Although it does not form part of these Terms, it is an important document that you should read.
                <br />
                <br />
              </Typography>
              <Typography
                variant='h5'
                align='left'
                marginTop={theme.spacing(1)}
                gutterBottom
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                Who we are
              </Typography>
              <Typography
                variant='body1'
                align='left'
                marginTop={theme.spacing(1)}
                gutterBottom
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                Banbury is a software development company focused on creating innovative and user-friendly solutions
                for both consumer and enterprise markets. For more information, visit our about page
                <br />
                <br />
              </Typography>
              <Typography
                variant='h5'
                align='left'
                marginTop={theme.spacing(1)}
                gutterBottom
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                Registration and access
              </Typography>
              <Typography
                variant='body1'
                align='left'
                marginTop={theme.spacing(1)}
                gutterBottom
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                Minimum age. You must be at least 13 years old or the minimum age required in your country to consent to use the Services. If you are under 18 you must have your parent or legal guardian&apos;s permission to use the Services.
                <br />
                <br />
                Registration. You must provide accurate and complete information to register for an account to use our Services. You may not share your account credentials or make your account available to anyone else and are responsible for all activities that occur under your account. If you create an account or use the Services on behalf of another person or entity, you must have the authority to accept these Terms on their behalf.
                <br />
                <br />
              </Typography>
              <Typography
                variant='h5'
                align='left'
                marginTop={theme.spacing(1)}
                gutterBottom
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                Using our Services
              </Typography>
              <Typography
                variant='body1'
                align='left'
                marginTop={theme.spacing(1)}
                gutterBottom
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                What you can do. Subject to your compliance with these Terms, you may access and use our Services. In using our Services, you must comply with all applicable laws as well as our Sharing & Publication Policy, Usage Policies, and any other documentation, guidelines, or policies we make available to you.
                <br />
                <br />
                Registration. You must provide accurate and complete information to register for an account to use our Services. You may not share your account credentials or make your account available to anyone else and are responsible for all activities that occur under your account. If you create an account or use the Services on behalf of another person or entity, you must have the authority to accept these Terms on their behalf.
                <br />
                <br />
                • Use our Services in a way that infringes, misappropriates or violates anyone&apos;s rights.
                <br />
                <br />
                • Modify, copy, lease, sell or distribute any of our Services.
                <br />
                <br />
                • Attempt to or assist anyone to reverse engineer, decompile or discover the source code or underlying components of our Services, including our models, algorithms, or systems (except to the extent this restriction is prohibited by applicable law).
                <br />
                <br />
                • Automatically or programmatically extract data or Output (defined below).
                <br />
                <br />
                • Represent that Output was human-generated when it was not.
                <br />
                <br />
                • Interfere with or disrupt our Services, including circumvent any rate limits or restrictions or bypass any protective measures or safety mitigations we put on our Services.
                <br />
                <br />
                Software. Our Services may allow you to download software, such as mobile applications, which may update automatically to ensure you&apos;re using the latest version. Our software may include open source software that is governed by its own licenses that we&apos;ve made available to you.
                <br />
                <br />
                Corporate domains. If you create an account using an email address owned by an organization (for example, your employer), that account may be added to the organization&apos;s business account with us, in which case we will provide notice to you so that you can help facilitate the transfer of your account (unless your organization has already provided notice to you that it may monitor and control your account). Once your account is transferred, the organization&apos;s administrator will be able to control your account, including being able to access Content (defined below) and restrict or remove your access to the account.
                <br />
                <br />
                Third party Services. Our services may include third party software, products, or services, (&quot;Third Party Services&quot;) and some parts of our Services, like our browse feature, may include output from those services (&quot;Third Party Output&quot;). Third Party Services and Third Party Output are subject to their own terms, and we are not responsible for them.
                <br />
                <br />
                Feedback. We appreciate your feedback, and you agree that we may use it without restriction or compensation to you.
              </Typography>



            </Box>
          </Container>



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

export default Terms_of_use;
