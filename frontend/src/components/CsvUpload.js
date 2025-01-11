import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Stack,
  Link,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import axios from 'axios';
import SuccessDialog from './SuccessDialog';
import { getApiUrl, API_ENDPOINTS } from '../config';

const SUPPORTED_FORMATS = [
  { extension: 'csv', description: 'CSV (Comma Separated Values)' },
  { extension: 'xlsx', description: 'Excel Workbook' },
  { extension: 'xls', description: 'Excel 97-2003 Workbook' },
  { extension: 'ods', description: 'OpenDocument Spreadsheet' },
  { extension: 'numbers', description: 'Apple Numbers' },
];

function FileUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [formLink, setFormLink] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [password, setPassword] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (SUPPORTED_FORMATS.some(format => format.extension === fileExtension)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setFile(null);
        setError('Please select a supported file format');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }
    if (!formTitle.trim()) {
      setError('Please enter a form title');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', formTitle);
    formData.append('password', password);

    try {
      const response = await axios.post(getApiUrl(API_ENDPOINTS.UPLOAD_FILE), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const formUrl = `${window.location.origin}/form/${response.data.uuid}`;
      setFormLink(formUrl);
      setSuccessDialogOpen(true);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error uploading file');
    }
  };

  const handleCloseDialog = () => {
    setSuccessDialogOpen(false);
    navigate('/');
  };

  return (
    <>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Upload Form Template
          </Typography>

          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary" paragraph>
                Download our sample template to see the required format:
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  component={Link}
                  href="/sample_form.csv"
                  download
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                >
                  CSV Template
                </Button>
                <Button
                  component={Link}
                  href="/sample_form.xlsx"
                  download
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                >
                  Excel Template
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Supported Formats:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                {SUPPORTED_FORMATS.map((format) => (
                  <Typography 
                    key={format.extension} 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5 
                    }}
                  >
                    <DescriptionIcon sx={{ fontSize: 16 }} />
                    {format.extension.toUpperCase()}
                  </Typography>
                ))}
              </Stack>
            </Box>

            <Divider />

            <Box 
              component="form" 
              onSubmit={handleSubmit}
              sx={{ 
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center'
              }}
            >
              <Stack spacing={2}>
                <TextField
                  required
                  label="Form Title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  fullWidth
                />
                <TextField
                  required
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                />

                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.ods,.numbers"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                  >
                    Choose File
                  </Button>
                </label>

                {file && (
                  <Typography color="text.secondary">
                    Selected file: {file.name}
                  </Typography>
                )}

                {error && (
                  <Alert severity="error">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={!file || !formTitle.trim() || !password.trim()}
                  fullWidth
                >
                  Upload and Create Form
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <SuccessDialog
        open={successDialogOpen}
        onClose={handleCloseDialog}
        title="Form Created Successfully!"
        message="Your form has been created from the uploaded file. Share the link below with others to collect responses."
        link={formLink}
        showShare={true}
      />
    </>
  );
}

export default FileUpload; 