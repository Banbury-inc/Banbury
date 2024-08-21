import Hero from '../components/Hero';
import Products from '../components/Products';
import Services from '../components/Services';
import Pricing from '../components/Pricing';
import About from '../components/About';
import Contact from '../components/Contact';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Footer from '../components/Footer';


const Home = (): JSX.Element => {
  const theme = useTheme();
  return (
    <div id='home'>
      <Box
        sx={{
          paddingTop: 5,
          paddingBottom: 10,
          paddingX: 2,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box marginBottom={4}>
          <Typography
            variant='h1'
            align='center'
            // fontWeight={400}
            marginTop={theme.spacing(1)}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
              // textTransform: 'uppercase',
            }}
          >
            Building a better tomorrow
          </Typography>
          <Typography
            variant='subtitle1'
            align='center'
            marginTop={theme.spacing(1)}
            gutterBottom
            color={theme.palette.text.secondary}
          >
            We build tools that put the power in your hands, not ours.
          </Typography>
        </Box>
      </Box>

    </div>
  );
};

export default Home;
