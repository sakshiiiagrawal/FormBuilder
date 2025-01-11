import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl, API_ENDPOINTS } from '../config';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { FileDownload, TableView, ViewModule as CardViewIcon, ViewList as TableViewIcon } from '@mui/icons-material';

function ViewResponses() {
  const { uuid } = useParams();
  const [responses, setResponses] = useState([]);
  const [fields, setFields] = useState({});
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(0); // 0 for cards, 1 for table
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        // Get password from localStorage
        const password = localStorage.getItem(`form_password_${uuid}`);
        if (!password) {
          setError('Password is required to view responses');
          setLoading(false);
          return;
        }

        const response = await axios.get(getApiUrl(API_ENDPOINTS.VIEW_RESPONSES(uuid)), {
          params: { password }
        });
        
        setResponses(response.data.responses || []);
        setFields(response.data.fields || {});
        setTitle(response.data.title || '');
      } catch (error) {
        // Handle different error types
        let errorMessage = 'Error fetching responses';
        if (error.response) {
          if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.msg) {
            errorMessage = typeof error.response.data.msg === 'object' 
              ? JSON.stringify(error.response.data.msg) 
              : error.response.data.msg;
          }
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [uuid]);

  const handleTabChange = (event, newValue) => {
    setViewMode(newValue);
  };

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const prepareExportData = () => {
    // Prepare headers (questions and sub-questions)
    const headers = [];
    Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
      // Add main field
      headers.push(fieldName);
      
      // Add sub-questions if they exist
      if (fieldConfig.subQuestions) {
        Object.entries(fieldConfig.subQuestions).forEach(([optionValue, subQuestions]) => {
          subQuestions.forEach(subQ => {
            headers.push(`${fieldName} > ${optionValue} > ${subQ.name}`);
          });
        });
      }
    });

    // Prepare content rows
    const rows = responses.map(response => {
      return headers.map(header => {
        if (header.includes(' > ')) {
          // This is a sub-question
          const [fieldName, optionValue, subQName] = header.split(' > ');
          const mainResponse = response[fieldName];
          
          // Only include sub-response if the main response matches the option value
          if (mainResponse?.value === optionValue) {
            const subResponse = mainResponse.subResponses?.[subQName];
            return subResponse || '';
          }
          return ''; // Empty value if option doesn't match
        } else {
          // This is a main question
          return response[header]?.value || '';
        }
      });
    });

    return { headers, rows };
  };

  const exportToCSV = () => {
    const { headers, rows } = prepareExportData();
    
    // Add title as the first row
    let csvContent = `Form Title: ${title}\n\n`;
    
    // Add headers
    csvContent += headers.join(',') + '\n';
    
    // Add data rows
    rows.forEach(row => {
      csvContent += row.map(value => `"${(value || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleExportClose();
  };

  const exportToExcel = () => {
    const { headers, rows } = prepareExportData();
    
    // Create XML content for Excel
    let excelContent = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    excelContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
    excelContent += '<Worksheet ss:Name="Responses"><Table>';
    
    // Add title row
    excelContent += '<Row><Cell ss:MergeAcross="' + (headers.length - 1) + '"><Data ss:Type="String">Form Title: ' + title + '</Data></Cell></Row>';
    excelContent += '<Row></Row>'; // Empty row for spacing
    
    // Add headers
    excelContent += '<Row>';
    headers.forEach(header => {
      excelContent += '<Cell><Data ss:Type="String">' + header + '</Data></Cell>';
    });
    excelContent += '</Row>';
    
    // Add data rows
    rows.forEach(row => {
      excelContent += '<Row>';
      row.forEach(cell => {
        excelContent += '<Cell><Data ss:Type="String">' + (cell || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</Data></Cell>';
      });
      excelContent += '</Row>';
    });
    
    excelContent += '</Table></Worksheet></Workbook>';
    
    // Create and trigger download
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title}_responses.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleExportClose();
  };

  const renderCardView = () => (
    <Stack spacing={2.5}>
      {responses.map((response, index) => (
        <Paper
          key={index}
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(245, 247, 250, 0.85)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
              backgroundColor: 'rgba(245, 247, 250, 0.95)',
            }
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              color: 'text.primary',
              fontWeight: 500,
              mb: 2
            }}
          >
            Response #{index + 1}
          </Typography>
          <Stack spacing={2.5}>
            {Object.entries(fields).map(([fieldName, fieldConfig]) => (
              <Box key={fieldName}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: 'text.secondary',
                    mb: 0.5,
                    fontWeight: 500
                  }}
                >
                  {fieldName}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>
                  {response[fieldName]?.value || 'No response'}
                </Typography>
                {fieldConfig.subQuestions && response[fieldName]?.value && (
                  <Box sx={{ 
                    ml: 3, 
                    mt: 1.5, 
                    borderLeft: '2px solid rgba(0, 0, 0, 0.06)', 
                    pl: 2 
                  }}>
                    {fieldConfig.subQuestions[response[fieldName].value]?.map((subQuestion) => (
                      <Box key={subQuestion.name} sx={{ mb: 1.5 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                            mb: 0.5
                          }}
                        >
                          {subQuestion.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ color: 'text.secondary' }}
                        >
                          {response[fieldName]?.subResponses?.[subQuestion.name] || 'No response'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );

  const renderTableView = () => (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Response #</TableCell>
            {Object.keys(fields).map((fieldName) => (
              <TableCell key={fieldName}>{fieldName}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {responses.map((response, index) => (
            <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
              <TableCell>{index + 1}</TableCell>
              {Object.keys(fields).map((fieldName) => (
                <TableCell key={fieldName}>
                  <Box>
                    <Typography>{response[fieldName]?.value || 'No response'}</Typography>
                    {fields[fieldName].subQuestions && response[fieldName]?.value && (
                      <Box sx={{ ml: 2, borderLeft: '2px solid #e0e0e0', pl: 2, mt: 1 }}>
                        {fields[fieldName].subQuestions[response[fieldName].value]?.map((subQuestion) => (
                          <Box key={subQuestion.name}>
                            <Typography variant="caption" color="text.secondary">
                              {subQuestion.name}:
                            </Typography>
                            <Typography variant="body2">
                              {response[fieldName]?.subResponses?.[subQuestion.name] || 'No response'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 500,
            color: 'text.primary'
          }}
        >
          {title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<FileDownload />}
          onClick={handleExportClick}
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'primary.dark',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }
          }}
        >
          Export Responses
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleExportClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1,
              minWidth: 180,
              borderRadius: 1,
              '& .MuiMenuItem-root': {
                py: 1,
                px: 2,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
            },
          }}
        >
          <MenuItem onClick={exportToExcel}>
            <ListItemIcon>
              <TableView sx={{ color: '#217346' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Export to Excel"
              primaryTypographyProps={{
                sx: { color: 'text.primary' }
              }}
            />
          </MenuItem>
          <MenuItem onClick={exportToCSV}>
            <ListItemIcon>
              <FileDownload sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Export to CSV"
              primaryTypographyProps={{
                sx: { color: 'text.primary' }
              }}
            />
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        mb: 4,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5,
          backgroundColor: 'background.default',
          padding: '6px',
          borderRadius: 1.5,
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
        }}>
          <Tooltip title="Card View" arrow>
            <IconButton 
              onClick={() => handleTabChange(null, 0)}
              sx={{ 
                backgroundColor: viewMode === 0 ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                color: viewMode === 0 ? 'primary.main' : 'text.secondary',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: viewMode === 0 
                    ? 'rgba(25, 118, 210, 0.12)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <CardViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Table View" arrow>
            <IconButton 
              onClick={() => handleTabChange(null, 1)}
              sx={{ 
                backgroundColor: viewMode === 1 ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                color: viewMode === 1 ? 'primary.main' : 'text.secondary',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: viewMode === 1 
                    ? 'rgba(25, 118, 210, 0.12)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <TableViewIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {viewMode === 0 ? renderCardView() : renderTableView()}
    </Box>
  );
}

export default ViewResponses; 