import { Box, Card, CardMedia, Container, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { useState, useEffect } from 'react';


interface ProductsProps {
  name: string;
  description: string;
  image: string;
}

const Privacy_Policy = (): JSX.Element => {
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
    <div id='privacy-policy'>
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
            Privacy Policy
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
                {/* Last updated: January 1, 2024 */}
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
                At Banbury Innovations, Inc., we are committed to protecting your privacy and ensuring the security 
                of your personal information. This Privacy Policy explains how we collect, use, disclose, and 
                safeguard your information when you use our services, including NeuraNet, Banbury Cloud, and 
                other related products (collectively, the &quot;Services&quot;).
                <br />
                <br />
                By using our Services, you agree to the collection and use of information in accordance with 
                this Privacy Policy. If you do not agree with this policy, please do not use our Services.
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
                Information We Collect
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
                Personal Information: When you create an account or use our Services, we may collect personal 
                information such as your name, email address, phone number, and payment information.
                <br />
                <br />
                Usage Data: We automatically collect information about how you use our Services, including 
                your IP address, browser type, operating system, access times, and pages viewed.
                <br />
                <br />
                Device Information: We may collect information about the devices you use to access our Services, 
                including device identifiers, hardware models, and operating system versions.
                <br />
                <br />
                Files and Content: When you use our cloud storage services, we may process and store your files 
                and content to provide the Services to you.
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
                How We Use Your Information
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
                We use the information we collect to:
                <br />
                <br />
                • Provide, maintain, and improve our Services
                <br />
                • Process transactions and send related information
                <br />
                • Send technical notices, updates, security alerts, and support messages
                <br />
                • Respond to your comments, questions, and customer service requests
                <br />
                • Monitor and analyze trends, usage, and activities in connection with our Services
                <br />
                • Detect, investigate, and prevent fraudulent transactions and other illegal activities
                <br />
                • Personalize and improve your experience with our Services
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
                Information Sharing and Disclosure
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
                We do not sell, trade, or otherwise transfer your personal information to third parties without 
                your consent, except in the following circumstances:
                <br />
                <br />
                Service Providers: We may share your information with third-party service providers who perform 
                services on our behalf, such as payment processing, data analysis, and customer support.
                <br />
                <br />
                Legal Requirements: We may disclose your information if required to do so by law or in response 
                to valid requests by public authorities.
                <br />
                <br />
                Business Transfers: In the event of a merger, acquisition, or sale of assets, your information 
                may be transferred as part of that transaction.
                <br />
                <br />
                Protection of Rights: We may disclose your information to protect our rights, property, or safety, 
                or the rights, property, or safety of others.
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
                Data Security
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
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. These measures include:
                <br />
                <br />
                • Encryption of data in transit and at rest
                <br />
                • Regular security assessments and updates
                <br />
                • Access controls and authentication procedures
                <br />
                • Employee training on data protection practices
                <br />
                <br />
                However, no method of transmission over the internet or electronic storage is 100% secure, 
                and we cannot guarantee absolute security.
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
                Your Rights and Choices
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
                You have certain rights regarding your personal information, including:
                <br />
                <br />
                • Access: You can request access to the personal information we hold about you
                <br />
                • Correction: You can request that we correct inaccurate or incomplete information
                <br />
                • Deletion: You can request that we delete your personal information, subject to certain exceptions
                <br />
                • Portability: You can request a copy of your personal information in a structured, machine-readable format
                <br />
                • Objection: You can object to our processing of your personal information in certain circumstances
                <br />
                <br />
                To exercise these rights, please contact us using the information provided below.
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
                Children&apos;s Privacy
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
                Our Services are not intended for children under the age of 13. We do not knowingly collect 
                personal information from children under 13. If you are a parent or guardian and believe 
                your child has provided us with personal information, please contact us immediately.
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
                Changes to This Privacy Policy
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
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are 
                advised to review this Privacy Policy periodically for any changes.
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
                Contact Us
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
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
                <br />
                <br />
                Email: privacy@banbury.io
                <br />
                Address: Banbury Innovations, Inc., Delaware, United States
                <br />
                <br />
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

export default Privacy_Policy; 