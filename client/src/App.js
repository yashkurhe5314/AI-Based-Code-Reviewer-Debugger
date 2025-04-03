import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/review', {
        code,
        language,
      });
      setReview(response.data.review);
    } catch (error) {
      console.error('Error:', error);
      setReview('Error reviewing code. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        AI Code Reviewer & Debugger
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Programming Language</InputLabel>
          <Select
            value={language}
            label="Programming Language"
            onChange={(e) => setLanguage(e.target.value)}
          >
            <MenuItem value="javascript">JavaScript</MenuItem>
            <MenuItem value="python">Python</MenuItem>
            <MenuItem value="java">Java</MenuItem>
            <MenuItem value="cpp">C++</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          label="Enter your code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Review Code'}
        </Button>
      </Box>

      {review && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Review Results
          </Typography>
          <Typography
            component="div"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
            }}
          >
            {review}
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default App;