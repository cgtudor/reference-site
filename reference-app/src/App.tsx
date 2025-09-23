import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { ReferenceApp } from './components/ReferenceApp';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ReferenceApp />
    </ThemeProvider>
  );
}

export default App;
