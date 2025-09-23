import { createTheme, ThemeOptions } from '@mui/material/styles';

// Neverwinter Nights inspired color palette
const palette = {
  primary: {
    main: '#4A90E2',      // Blue like NWN interface
    light: '#7BB3F0',
    dark: '#2E5A8A',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#F39C12',      // Gold/orange accent
    light: '#F7B731',
    dark: '#E67E22',
    contrastText: '#000000',
  },
  background: {
    default: '#0D1117',   // Dark GitHub-like background
    paper: '#161B22',     // Slightly lighter for cards/papers
  },
  surface: {
    main: '#21262D',      // For elevated surfaces
    light: '#30363D',
    dark: '#161B22',
  },
  text: {
    primary: '#F0F6FC',   // Primary text - light
    secondary: '#8B949E', // Secondary text - muted
  },
  divider: '#30363D',
  action: {
    hover: 'rgba(177, 186, 196, 0.08)',
    selected: 'rgba(177, 186, 196, 0.12)',
  },
};

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    ...palette,
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    body1: {
      fontSize: '1rem',
      color: palette.text.primary,
    },
    body2: {
      fontSize: '0.875rem',
      color: palette.text.secondary,
    },
  },
  components: {
    // Paper component for cards
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper,
          backgroundImage: 'none',
        },
      },
    },
    // Tab styling
    MuiTab: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
          '&.Mui-selected': {
            color: palette.primary.main,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: palette.primary.main,
        },
      },
    },
    // AppBar styling
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.surface.main,
          color: palette.text.primary,
          boxShadow: `0 1px 0 ${palette.divider}`,
        },
      },
    },
    // TextField styling
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: palette.divider,
            },
            '&:hover fieldset': {
              borderColor: palette.primary.light,
            },
            '&.Mui-focused fieldset': {
              borderColor: palette.primary.main,
            },
          },
        },
      },
    },
    // Button styling
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
        outlined: {
          borderColor: palette.divider,
          color: palette.text.primary,
          '&:hover': {
            borderColor: palette.primary.main,
            backgroundColor: palette.action.hover,
          },
        },
      },
    },
    // Chip styling for ID display
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-colorPrimary': {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
          },
        },
        outlined: {
          borderColor: palette.primary.main,
          color: palette.primary.main,
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);