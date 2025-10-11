import { createTheme } from '@mui/material';
import { amber, common, green, grey, lightBlue, red } from '@mui/material/colors';

export const createAppTheme = (mode: 'light' | 'dark' = 'light') => {
  const isDarkMode = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        dark: isDarkMode ? grey['200'] : common['black'],
        main: isDarkMode ? common['white'] : grey['900'],
        light: isDarkMode ? grey['800'] : grey['100'],
      },
      secondary: {
        main: isDarkMode ? grey['100'] : grey['800'],
      },
      success: {
        main: green['700'],
      },
      error: {
        main: red['700'],
      },
      info: {
        main: lightBlue['700'],
      },
      warning: {
        main: amber['700'],
      },
      divider: isDarkMode ? grey[800] : grey[300],
      background: {
        default: isDarkMode ? common['black'] : grey[50],
        paper: isDarkMode ? common['black'] : common['white'],
      },
    },
    shape: {
      borderRadius: 4,
    },
    spacing: 8,
    typography: {
      fontSize: 14,
      htmlFontSize: 16,
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
      fontWeightMedium: 600,
      fontWeightBold: 700,
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
    },
    shadows: [
      'none',
      '0px 1px 2px rgba(0, 0, 0, 0.05)',
      '0px 1px 3px rgba(0, 0, 0, 0.1)',
      '0px 2px 4px rgba(0, 0, 0, 0.1)',
      '0px 2px 6px rgba(0, 0, 0, 0.1)',
      '0px 4px 8px rgba(0, 0, 0, 0.1)',
      '0px 6px 12px rgba(0, 0, 0, 0.1)',
      '0px 8px 16px rgba(0, 0, 0, 0.1)',
      '0px 12px 24px rgba(0, 0, 0, 0.1)',
      '0px 16px 32px rgba(0, 0, 0, 0.1)',
      '0px 20px 40px rgba(0, 0, 0, 0.1)',
      '0px 24px 48px rgba(0, 0, 0, 0.1)',
      '0px 28px 56px rgba(0, 0, 0, 0.1)',
      '0px 32px 64px rgba(0, 0, 0, 0.1)',
      '0px 36px 72px rgba(0, 0, 0, 0.1)',
      '0px 40px 80px rgba(0, 0, 0, 0.1)',
      '0px 44px 88px rgba(0, 0, 0, 0.1)',
      '0px 48px 96px rgba(0, 0, 0, 0.1)',
      '0px 52px 104px rgba(0, 0, 0, 0.1)',
      '0px 56px 112px rgba(0, 0, 0, 0.1)',
      '0px 60px 120px rgba(0, 0, 0, 0.1)',
      '0px 64px 128px rgba(0, 0, 0, 0.1)',
      '0px 68px 136px rgba(0, 0, 0, 0.1)',
      '0px 72px 144px rgba(0, 0, 0, 0.1)',
      '0px 76px 152px rgba(0, 0, 0, 0.1)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            colorScheme: isDarkMode ? 'dark' : 'light',
          },
          html: {
            minHeight: '100%',
          },
          body: {
            minHeight: '100%',
            backgroundColor: isDarkMode ? common['black'] : grey[50],
          },
        },
      },
      MuiIconButton: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiListItemButton: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? common['black'] : common['white'],
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiButton: {
        defaultProps: {
          disableRipple: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          sizeSmall: {
            padding: '4px 12px',
          },
          sizeMedium: {
            padding: '8px 16px',
          },
          sizeLarge: {
            padding: '12px 24px',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            border: 0,
            borderBottom: `1px solid ${isDarkMode ? grey[800] : grey[300]}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDarkMode ? common['black'] : common['white'],
            border: 0,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: 'none',
            border: `1px solid ${isDarkMode ? grey[800] : grey[300]}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDarkMode ? '#090909' : common['white'],
            border: `1px solid ${isDarkMode ? grey[800] : grey[300]}`,
          },
        },
      },
    },
  });
};
