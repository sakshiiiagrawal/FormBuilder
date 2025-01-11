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
  const [formTitle, setFormTitle] = useState('');
  const [expandedImage, setExpandedImage] = useState(null);

  const fetchResponses = useCallback(async (formUuid, pwd) => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl(API_ENDPOINTS.VIEW_RESPONSES(formUuid)) + `?password=${pwd}`);
      setResponses(response.data.responses);
      setFields(response.data.fields);
      setFormTitle(response.data.title);
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

  const renderResponse = (fieldName, fieldConfig, response) => {
    if (typeof response === 'object' && response.value) {
      return (
        <Box>
          <Typography variant="body1">
            {response.value}
          </Typography>
          {response.subResponses && fieldConfig.subQuestions?.[response.value] && (
            <Box sx={{ ml: 4, mt: 1, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
              {fieldConfig.subQuestions[response.value].map((subQuestion, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {subQuestion.name}:
                  </Typography>
                  <Typography variant="body2">
                    {Array.isArray(response.subResponses[subQuestion.name]) 
                      ? response.subResponses[subQuestion.name].join(', ')
                      : response.subResponses[subQuestion.name]}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      );
    }

    if (typeof response === 'string' && response.startsWith('data:image')) {
      return (
        <Box>
          <img 
            src={response} 
            alt="Response" 
            style={{ maxWidth: '100%', maxHeight: '200px' }} 
          />
        </Box>
      );
    }

    return <Typography variant="body1">{response || '-'}</Typography>;
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
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            {formTitle}
          </Typography>

          <Typography 
            variant="h5" 
            gutterBottom 
            align="center"
            sx={{ 
              mb: 4,
              fontWeight: 500,
              color: 'text.secondary'
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
            <Stack spacing={4}>
              {responses.map((response, responseIndex) => (
                <Paper key={responseIndex} elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Response #{responseIndex + 1}
                  </Typography>
                  <Stack spacing={2}>
                    {Object.entries(fields).map(([fieldName, fieldConfig]) => (
                      <Box key={fieldName}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          {fieldName}
                        </Typography>
                        {renderResponse(fieldName, fieldConfig, response[fieldName])}
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