import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl, API_ENDPOINTS } from '../config';
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
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);

  const fetchResponses = useCallback(async (formUuid, pwd) => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl(API_ENDPOINTS.VIEW_RESPONSES(formUuid)) + `?password=${pwd}`);
      setResponses(response.data.responses);
      setFields(response.data.fields);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error loading responses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uuid) {
      const password = localStorage.getItem(`form_password_${uuid}`);
      if (password) {
        fetchResponses(uuid, password);
      } else {
        navigate('/');
      }
    }
  }, [uuid, fetchResponses, navigate]);

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
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
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
            Form Responses
          </Typography>

          {loading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress />
              <Typography sx={{ mt: 1 }} align="center">Loading responses...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {responses.length === 0 && !loading ? (
            <Alert severity="info">No responses yet</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Response #</TableCell>
                    {fields.map((field) => (
                      <TableCell key={field} sx={{ fontWeight: 'bold' }}>
                        {field}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {responses.map((response, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        '&:nth-of-type(odd)': { 
                          backgroundColor: 'background.default' 
                        }
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      {fields.map((field) => (
                        <TableCell key={field}>
                          {renderCellContent(field, response[field])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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