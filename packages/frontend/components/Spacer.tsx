import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';

interface Props {
  [x: string]: any;
}

const Spacer = ({ sx = [] }: Props): JSX.Element => {
  const theme = useTheme();

  return (
    <Box
      sx={[
        {
          backgroundColor: theme.palette.background.default,
        },
        ...[sx],
      ]}
    ></Box>
  );
};

export default Spacer;
