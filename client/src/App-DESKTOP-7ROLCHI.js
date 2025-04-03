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
  Alert,
  Grid,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import axios from 'axios';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/review', {
        code,
        language,
      });
      setReview(response.data.review);
    } catch (error) {
      console.error('Error details:', error);
      setError(error.response?.data?.error || error.message || 'Error reviewing code. Please try again.');
      setReview('');
    }
    setLoading(false);
  };

  const getMetricColor = (metric) => {
    switch (metric) {
      case 'High': return 'success';
      case 'Medium': return 'warning';
      case 'Low': return 'error';
      default: return 'default';
    }
  };

  const getBugTypeColor = (type) => {
    switch (type) {
      case 'syntax': return 'error';
      case 'runtime': return 'warning';
      case 'logical': return 'info';
      case 'security': return 'error';
      default: return 'default';
    }
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {review && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Review Results
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Code Analysis
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography><strong>Language:</strong> {review.codeAnalysis.language}</Typography>
                <Typography><strong>Total Lines:</strong> {review.codeAnalysis.totalLines}</Typography>
                <Typography><strong>Comment Lines:</strong> {review.codeAnalysis.commentLines}</Typography>
                <Typography><strong>Function Count:</strong> {review.codeAnalysis.functionCount}</Typography>
                <Typography><strong>Code to Comment Ratio:</strong> {review.codeAnalysis.codeToCommentRatio.toFixed(1)}%</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`Complexity: ${review.codeAnalysis.complexity}`}
                    color={getMetricColor(review.codeAnalysis.complexity)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Code Metrics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={`Maintainability: ${review.metrics.maintainability}`}
                  color={getMetricColor(review.metrics.maintainability)}
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip 
                  label={`Readability: ${review.metrics.readability}`}
                  color={getMetricColor(review.metrics.readability)}
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip 
                  label={`Efficiency: ${review.metrics.efficiency}`}
                  color={getMetricColor(review.metrics.efficiency)}
                  sx={{ mr: 1, mb: 1 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Debugging Analysis
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Total Issues Found: {review.debugging.bugCount}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip 
                    label={`Syntax: ${review.debugging.bugTypes.syntax}`}
                    color="error"
                    size="small"
                  />
                  <Chip 
                    label={`Runtime: ${review.debugging.bugTypes.runtime}`}
                    color="warning"
                    size="small"
                  />
                  <Chip 
                    label={`Logical: ${review.debugging.bugTypes.logical}`}
                    color="info"
                    size="small"
                  />
                  <Chip 
                    label={`Security: ${review.debugging.bugTypes.security}`}
                    color="error"
                    size="small"
                  />
                </Box>
              </Box>

              {review.debugging.bugs.length > 0 ? (
                <Box>
                  {review.debugging.bugs.map((bug, index) => (
                    <Paper 
                      key={index} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        borderLeft: 4, 
                        borderColor: getBugTypeColor(bug.type),
                        backgroundColor: 'background.default'
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        {bug.message}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Line: {bug.line}
                      </Typography>
                      
                      <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2" color="success.main">
                            View Suggested Fix
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Before:
                            </Typography>
                            <Paper 
                              sx={{ 
                                p: 2, 
                                bgcolor: 'grey.100',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {bug.fix.before}
                            </Paper>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              After:
                            </Typography>
                            <Paper 
                              sx={{ 
                                p: 2, 
                                bgcolor: 'success.light',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {bug.fix.after}
                            </Paper>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary">
                            {bug.fix.explanation}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography color="success.main">
                  No potential bugs or issues found in the code.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Suggestions for Improvement
              </Typography>
              <Box>
                {review.suggestions.map((suggestion, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {suggestion.message}
                    </Typography>
                    {suggestion.example && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2" color="success.main">
                            View Code Example
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Before:
                            </Typography>
                            <Paper 
                              sx={{ 
                                p: 2, 
                                bgcolor: 'grey.100',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {suggestion.example.before}
                            </Paper>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              After:
                            </Typography>
                            <Paper 
                              sx={{ 
                                p: 2, 
                                bgcolor: 'success.light',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {suggestion.example.after}
                            </Paper>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Paper>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Best Practices for {review.codeAnalysis.language}
              </Typography>
              <ul>
                {review.bestPractices.map((practice, index) => (
                  <li key={index}>{practice}</li>
                ))}
              </ul>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
}

export default App;