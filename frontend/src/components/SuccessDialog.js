import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
  Snackbar,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

function SuccessDialog({ 
  open, 
  onClose, 
  title, 
  message, 
  link,
  showShare = true 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Form Link',
          text: message,
          url: link,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 3 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
          >
            <CheckCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main',
                mb: 2
              }} 
            />
          </motion.div>
          <Typography variant="h5" component="div" fontWeight="bold">
            {title}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography align="center" color="text.secondary" paragraph>
            {message}
          </Typography>

          {showShare && (
            <Box sx={{ mt: 3 }}>
              <Stack spacing={2}>
                <TextField
                  value={link}
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={handleCopy} size="small">
                        <ContentCopyIcon />
                      </IconButton>
                    ),
                  }}
                />

                {navigator.share && (
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={handleShare}
                    fullWidth
                  >
                    Share Form
                  </Button>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pt: 2 }}>
          <Button 
            onClick={onClose}
            variant="contained"
            sx={{ px: 4 }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        message="Link copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

export default SuccessDialog; 