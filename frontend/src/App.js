import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import FormCreate from './components/FormCreate';
import FormUpload from './components/FormUpload';
import ViewResponses from './components/ViewResponses';
import Navigation from './components/Navigation';

function App() {
  return (
    <Box>
      <Navigation />
      <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
        <Routes>
          <Route path="/" element={<FormCreate />} />
          <Route path="/upload" element={<FormUpload />} />
          <Route path="/form/:uuid" element={<FormCreate />} />
          <Route path="/responses/:uuid" element={<ViewResponses />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App; 