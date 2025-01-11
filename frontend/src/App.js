import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Home from './components/Home';
import FormCreate from './components/FormCreate';
import CsvUpload from './components/CsvUpload';
import ViewResponses from './components/ViewResponses';
import FormView from './components/FormView';
import Navigation from './components/Navigation';

function App() {
  return (
    <Box>
      <Navigation />
      <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<FormCreate />} />
          <Route path="/upload" element={<CsvUpload />} />
          <Route path="/form/:uuid" element={<FormView />} />
          <Route path="/responses/:uuid" element={<ViewResponses />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App; 