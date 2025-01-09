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
} from '@mui/material';
import axios from 'axios';

function ViewResponses() {
  const { uuid } = useParams();
  const [responses, setResponses] = useState([]);
  const [password, setPassword] = useState('');
  const [dialogOpen, setDialogOpen] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState([]);

  const fetchResponses = useCallback(async (pwd) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/view-responses/${uuid}?password=${pwd}`);
      setResponses(response.data.responses);
      setFields(response.data.fields);
      setError(null);
      setDialogOpen(false);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error loading responses');
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (!dialogOpen && password) {
      fetchResponses(password);
    }
  }, [dialogOpen, password, fetchResponses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchResponses(password);
  };

  if (dialogOpen) {
    return (
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Enter Password</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              View Responses
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }} align="center">Loading responses...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Form Responses
        </Typography>

        {responses.length === 0 ? (
          <Alert severity="info">No responses yet</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {fields.map((field) => (
                    <TableCell key={field}>{field}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {responses.map((response, index) => (
                  <TableRow key={index}>
                    {fields.map((field) => (
                      <TableCell key={field}>
                        {Array.isArray(response[field])
                          ? response[field].join(', ')
                          : response[field]}
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
  );
}

export default ViewResponses; 