import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  IconButton,
  Modal,
  Stack,
} from '@mui/material';
import { LocationOn, Close } from '@mui/icons-material';
import axios from 'axios';

function ViewResponses() {
  const [responses, setResponses] = useState([]);
  const [password, setPassword] = useState('');
  const [formId, setFormId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);

  const fetchResponses = useCallback(async (uuid, pwd) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/view-responses/${uuid}?password=${pwd}`);
      setResponses(response.data.responses);
      setFields(response.data.fields);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error loading responses');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formId && password) {
      fetchResponses(formId, password);
    }
  };

  const handleImageClick = (imageData) => {
    setExpandedImage(imageData);
  };

  const handleCloseExpandedImage = () => {
    setExpandedImage(null);
  };

  const renderCellContent = (field, value) => {
    if (!value) return '';
    
    try {
      const parsed = JSON.parse(value);
      if (parsed.base64 && parsed.timestamp && parsed.location) {
        return (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 1,
            padding: 2,
            '& img': {
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }
          }}>
            <img 
              src={parsed.base64} 
              alt="Captured" 
              style={{ 
                width: '200px',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} 
              onClick={() => handleImageClick(parsed)}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500
              }}
            >
              {new Date(parsed.timestamp).toLocaleString()}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              href={`https://www.google.com/maps?q=${parsed.location.latitude},${parsed.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<LocationOn />}
              sx={{ 
                textTransform: 'none',
                borderRadius: '20px',
                fontSize: '0.75rem'
              }}
            >
              View Location
            </Button>
          </Box>
        );
      }
    } catch (e) {
      // If not a valid JSON string, treat as normal value
    }

    return Array.isArray(value) ? value.join(', ') : value;
  };

  return (
    <>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            align="center"
            sx={{ 
              mb: 4,
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            View Form Responses
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3} sx={{ mb: 4 }}>
              <TextField
                label="Form ID"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                required
                fullWidth
                placeholder="Enter the form UUID"
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter the form password"
              />
              <Button 
                type="submit" 
                variant="contained" 
                size="large"
                fullWidth
              >
                View Responses
              </Button>
              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}
            </Stack>
          </form>

          {loading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress />
              <Typography sx={{ mt: 1 }} align="center">Loading responses...</Typography>
            </Box>
          )}

          {responses.length === 0 ? (
            <Alert severity="info">No responses yet</Alert>
          ) : (
            <Stack spacing={4}>
              {responses.map((response, index) => (
                <Paper 
                  key={index} 
                  elevation={1} 
                  sx={{ 
                    p: 3,
                    backgroundColor: index % 2 === 0 ? 'background.default' : 'background.paper'
                  }}
                >
                  <Stack spacing={3}>
                    {fields.map((field) => (
                      <Box key={field}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'primary.main',
                            mb: 1
                          }}
                        >
                          {field}
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          {renderCellContent(field, response[field])}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <Modal
        open={!!expandedImage}
        onClose={handleCloseExpandedImage}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ 
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2,
          outline: 'none'
        }}>
          <IconButton
            onClick={handleCloseExpandedImage}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              bgcolor: 'rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.2)'
              }
            }}
          >
            <Close />
          </IconButton>
          {expandedImage && (
            <Box sx={{ mt: 4 }}>
              <img
                src={expandedImage.base64}
                alt="Expanded view"
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 100px)',
                  objectFit: 'contain'
                }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center' }}>
                Taken at: {new Date(expandedImage.timestamp).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
}

export default ViewResponses; 