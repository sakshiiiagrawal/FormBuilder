import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Alert, Link, TextField } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function FormUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formName, setFormName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    if (!formName.trim()) {
      setError('Please enter a form name');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('form_name', formName);
    if (password) {
      formData.append('password', password);
    }

    try {
      const response = await axios.post('http://localhost:8000/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Navigate to the form view page
      navigate(`/form/${response.data.uuid}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Upload Form Template
        </Typography>
        
        <Typography paragraph>
          Download our sample template to see the required format:
        </Typography>
        
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Link href="/templates/sample.csv" download>
            <Button variant="outlined" startIcon={<CloudUploadIcon />}>
              CSV TEMPLATE
            </Button>
          </Link>
          <Link href="/templates/sample.xlsx" download>
            <Button variant="outlined" startIcon={<CloudUploadIcon />}>
              EXCEL TEMPLATE
            </Button>
          </Link>
        </Box>

        <Typography variant="h6" gutterBottom>
          Supported Formats
        </Typography>
        
        <Box component="ul" sx={{ mb: 3 }}>
          <li>CSV (Comma Separated Values)</li>
          <li>Excel Workbook (.xlsx)</li>
          <li>Excel 97-2003 Workbook (.xls)</li>
          <li>OpenDocument Spreadsheet (.ods)</li>
        </Box>

        <Box sx={{ mb: 3 }}>
          <input
            accept=".csv,.xlsx,.xls,.ods"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              CHOOSE FILE
            </Button>
          </label>
          {selectedFile && (
            <Typography sx={{ mt: 1 }}>
              Selected file: {selectedFile.name}
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Form Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            margin="normal"
            placeholder="Enter a name for your form"
          />
          <TextField
            fullWidth
            label="Password (Optional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            type="password"
            placeholder="Set a password to protect form responses"
            helperText="Leave blank for no password protection"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!selectedFile || !formName.trim() || loading}
        >
          {loading ? 'Uploading...' : 'UPLOAD AND CREATE FORM'}
        </Button>
      </Paper>
    </Box>
  );
}

export default FormUpload; 