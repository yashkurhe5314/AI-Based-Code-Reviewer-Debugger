const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-code-reviewer')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Debugging functions
const analyzePotentialBugs = (code, language) => {
  const bugs = [];
  
  // Check for common syntax errors
  const syntaxErrors = checkSyntaxErrors(code, language);
  bugs.push(...syntaxErrors);

  // Check for runtime errors
  const runtimeErrors = checkRuntimeErrors(code, language);
  bugs.push(...runtimeErrors);

  // Check for logical errors
  const logicalErrors = checkLogicalErrors(code, language);
  bugs.push(...logicalErrors);

  // Check for security vulnerabilities
  const securityIssues = checkSecurityIssues(code, language);
  bugs.push(...securityIssues);

  return bugs;
};

const generateFix = (bug, language) => {
  const fixes = {
    syntax: {
      javascript: {
        'Missing semicolon': {
          before: 'let result = 5 + 3',
          after: 'let result = 5 + 3;',
          explanation: 'Add a semicolon at the end of the statement'
        },
        'Unmatched curly braces': {
          before: 'if (true) {\n    console.log("test")\n',
          after: 'if (true) {\n    console.log("test");\n}',
          explanation: 'Ensure all opening braces have matching closing braces'
        }
      },
      python: {
        'Incorrect indentation': {
          before: 'def test():\nprint("test")',
          after: 'def test():\n    print("test")',
          explanation: 'Use 4 spaces for indentation in Python'
        }
      },
      java: {
        'Missing semicolon': {
          before: 'System.out.println("Hello World")',
          after: 'System.out.println("Hello World");',
          explanation: 'Add a semicolon at the end of the statement'
        }
      },
      cpp: {
        'Missing semicolon': {
          before: 'cout << "Hello World"',
          after: 'cout << "Hello World";',
          explanation: 'Add a semicolon at the end of the statement'
        }
      }
    },
    runtime: {
      javascript: {
        'Potential undefined variable': {
          before: 'console.log(myVariable)',
          after: 'let myVariable = "value";\nconsole.log(myVariable);',
          explanation: 'Declare variables before using them'
        }
      },
      python: {
        'Potential division by zero': {
          before: 'result = number / divisor',
          after: 'if divisor != 0:\n    result = number / divisor\nelse:\n    print("Error: Division by zero")',
          explanation: 'Add a check for zero before division'
        }
      },
      java: {
        'Potential null pointer exception': {
          before: 'object.method()',
          after: 'if (object != null) {\n    object.method();\n}',
          explanation: 'Add null check before accessing object methods'
        }
      },
      cpp: {
        'Potential memory leak': {
          before: 'int* ptr = new int(5)',
          after: 'int* ptr = new int(5);\n// ... use ptr ...\ndelete ptr;',
          explanation: 'Always free allocated memory with delete'
        }
      }
    },
    logical: {
      'Potential infinite loop': {
        before: 'while(true) {\n    // code\n}',
        after: 'let condition = true;\nwhile(condition) {\n    // code\n    condition = false; // Add termination condition\n}',
        explanation: 'Add a proper termination condition to the loop'
      },
      'Unreachable code': {
        before: 'return value;\nconsole.log("This will never run");',
        after: 'console.log("This will run");\nreturn value;',
        explanation: 'Move the return statement to the end of the function'
      }
    },
    security: {
      'Potential SQL injection vulnerability': {
        before: 'query = "SELECT * FROM users WHERE id = " + userInput',
        after: 'const query = "SELECT * FROM users WHERE id = ?";\nconst params = [userInput];',
        explanation: 'Use parameterized queries to prevent SQL injection'
      },
      'Potential XSS vulnerability': {
        before: 'element.innerHTML = userInput',
        after: 'element.textContent = userInput;',
        explanation: 'Use textContent instead of innerHTML to prevent XSS attacks'
      }
    }
  };

  const languageFixes = fixes[bug.type]?.[language] || fixes[bug.type];
  const fix = languageFixes?.[bug.message] || {
    before: 'Original code',
    after: bug.fix,
    explanation: bug.fix
  };

  return {
    ...bug,
    fix: {
      before: fix.before,
      after: fix.after,
      explanation: fix.explanation
    }
  };
};

const checkSyntaxErrors = (code, language) => {
  const errors = [];
  const lines = code.split('\n');
  
  switch (language) {
    case 'javascript':
      // Check for missing semicolons
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine && 
            !trimmedLine.endsWith(';') && 
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') && 
            !trimmedLine.includes('if') && 
            !trimmedLine.includes('for') && 
            !trimmedLine.includes('while') && 
            !trimmedLine.includes('function') &&
            !trimmedLine.startsWith('//') &&
            !trimmedLine.startsWith('/*') &&
            !trimmedLine.startsWith('*') &&
            !trimmedLine.startsWith('const') &&
            !trimmedLine.startsWith('let') &&
            !trimmedLine.startsWith('var')) {
          errors.push(generateFix({
            type: 'syntax',
            message: 'Missing semicolon',
            line: index + 1,
            fix: 'Add semicolon at the end of the statement'
          }, language));
        }
      });

      // Check for unclosed brackets
      const openBrackets = (code.match(/\{/g) || []).length;
      const closeBrackets = (code.match(/\}/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push(generateFix({
          type: 'syntax',
          message: 'Unmatched curly braces',
          line: 'Multiple lines',
          fix: 'Check and match all opening and closing braces'
        }, language));
      }

      // Check for missing parentheses in function calls
      const functionCalls = code.match(/\b\w+\s*\([^)]*$/g) || [];
      functionCalls.forEach(call => {
        const line = code.split('\n').findIndex(line => line.includes(call)) + 1;
        errors.push(generateFix({
          type: 'syntax',
          message: 'Missing closing parenthesis in function call',
          line: line,
          fix: 'Add closing parenthesis to complete the function call'
        }, language));
      });

      // Check for missing quotes
      const unclosedQuotes = code.match(/["'][^"']*$/g) || [];
      unclosedQuotes.forEach(quote => {
        const line = code.split('\n').findIndex(line => line.includes(quote)) + 1;
        errors.push(generateFix({
          type: 'syntax',
          message: 'Unclosed string literal',
          line: line,
          fix: 'Add closing quote to complete the string'
        }, language));
      });

      break;

    case 'python':
      // Check for indentation
      let currentIndent = 0;
      lines.forEach((line, index) => {
        const indent = line.match(/^\s*/)[0].length;
        if (indent % 4 !== 0) {
          errors.push(generateFix({
            type: 'syntax',
            message: 'Incorrect indentation',
            line: index + 1,
            fix: 'Use 4 spaces for indentation'
          }, language));
        }
      });

      // Check for missing colons after control structures
      const controlStructures = ['if', 'for', 'while', 'def', 'class', 'else', 'elif'];
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        controlStructures.forEach(structure => {
          if (trimmedLine.startsWith(structure) && !trimmedLine.endsWith(':')) {
            errors.push(generateFix({
              type: 'syntax',
              message: `Missing colon after ${structure} statement`,
              line: index + 1,
              fix: 'Add colon after the statement'
            }, language));
          }
        });
      });

      // Check for missing parentheses in function calls
      const pyFunctionCalls = code.match(/\b\w+\s*\([^)]*$/g) || [];
      pyFunctionCalls.forEach(call => {
        const line = code.split('\n').findIndex(line => line.includes(call)) + 1;
        errors.push(generateFix({
          type: 'syntax',
          message: 'Missing closing parenthesis in function call',
          line: line,
          fix: 'Add closing parenthesis to complete the function call'
        }, language));
      });

      break;

    case 'java':
      // Check for missing semicolons
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine && 
            !trimmedLine.endsWith(';') && 
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') && 
            !trimmedLine.includes('if') && 
            !trimmedLine.includes('for') && 
            !trimmedLine.includes('while') && 
            !trimmedLine.includes('class') &&
            !trimmedLine.startsWith('//') &&
            !trimmedLine.startsWith('/*') &&
            !trimmedLine.startsWith('*')) {
          errors.push(generateFix({
            type: 'syntax',
            message: 'Missing semicolon',
            line: index + 1,
            fix: 'Add semicolon at the end of the statement'
          }, language));
        }
      });

      // Check for missing class declaration
      if (!code.includes('public class')) {
        errors.push(generateFix({
          type: 'syntax',
          message: 'Missing public class declaration',
          line: 1,
          fix: 'Add public class declaration'
        }, language));
      }

      // Check for missing main method
      if (!code.includes('public static void main')) {
        errors.push(generateFix({
          type: 'syntax',
          message: 'Missing main method',
          line: 'Multiple lines',
          fix: 'Add public static void main method'
        }, language));
      }

      break;

    case 'cpp':
      // Check for missing semicolons
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine && 
            !trimmedLine.endsWith(';') && 
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') && 
            !trimmedLine.includes('if') && 
            !trimmedLine.includes('for') && 
            !trimmedLine.includes('while') && 
            !trimmedLine.includes('class') &&
            !trimmedLine.startsWith('//') &&
            !trimmedLine.startsWith('/*') &&
            !trimmedLine.startsWith('*')) {
          errors.push(generateFix({
            type: 'syntax',
            message: 'Missing semicolon',
            line: index + 1,
            fix: 'Add semicolon at the end of the statement'
          }, language));
        }
      });

      // Check for missing includes
      if (code.includes('cout') && !code.includes('#include <iostream>')) {
        errors.push(generateFix({
          type: 'syntax',
          message: 'Missing iostream include',
          line: 1,
          fix: 'Add #include <iostream> at the beginning of the file'
        }, language));
      }

      // Check for missing namespace
      if (code.includes('cout') && !code.includes('using namespace std;')) {
        errors.push(generateFix({
          type: 'syntax',
          message: 'Missing namespace declaration',
          line: 'Multiple lines',
          fix: 'Add using namespace std; after includes'
        }, language));
      }

      break;
  }

  return errors;
};

const checkRuntimeErrors = (code, language) => {
  const errors = [];
  
  switch (language) {
    case 'javascript':
      // Check for undefined variables
      const variables = code.match(/var\s+(\w+)|let\s+(\w+)|const\s+(\w+)/g) || [];
      const usedVars = code.match(/\b[a-zA-Z_]\w*\b/g) || [];
      usedVars.forEach(varName => {
        if (!variables.some(v => v.includes(varName))) {
          errors.push(generateFix({
            type: 'runtime',
            message: 'Potential undefined variable',
            line: code.split('\n').findIndex(line => line.includes(varName)) + 1,
            fix: `Declare variable ${varName} before using it`
          }, language));
        }
      });
      break;

    case 'python':
      // Check for potential division by zero
      if (code.includes('/')) {
        errors.push(generateFix({
          type: 'runtime',
          message: 'Potential division by zero',
          line: code.split('\n').findIndex(line => line.includes('/')) + 1,
          fix: 'Add check for zero before division'
        }, language));
      }
      break;

    case 'java':
      // Check for null pointer exceptions
      if (code.includes('.') && !code.includes('null')) {
        errors.push(generateFix({
          type: 'runtime',
          message: 'Potential null pointer exception',
          line: code.split('\n').findIndex(line => line.includes('.')) + 1,
          fix: 'Add null check before accessing object methods'
        }, language));
      }
      break;

    case 'cpp':
      // Check for memory leaks
      if (code.includes('new ') && !code.includes('delete ')) {
        errors.push(generateFix({
          type: 'runtime',
          message: 'Potential memory leak',
          line: code.split('\n').findIndex(line => line.includes('new ')) + 1,
          fix: 'Add delete statement to free allocated memory'
        }, language));
      }
      break;
  }

  return errors;
};

const checkLogicalErrors = (code, language) => {
  const errors = [];
  
  // Check for infinite loops
  if (code.includes('while(true)') || code.includes('for(;;)')) {
    errors.push(generateFix({
      type: 'logical',
      message: 'Potential infinite loop',
      line: code.split('\n').findIndex(line => line.includes('while(true)') || line.includes('for(;;)')) + 1,
      fix: 'Add proper loop termination condition'
    }, language));
  }

  // Check for unreachable code
  if (code.includes('return') && code.includes('return', code.indexOf('return') + 7)) {
    errors.push(generateFix({
      type: 'logical',
      message: 'Unreachable code after return statement',
      line: code.split('\n').findIndex(line => line.includes('return')) + 1,
      fix: 'Remove code after return statement or restructure logic'
    }, language));
  }

  return errors;
};

const checkSecurityIssues = (code, language) => {
  const errors = [];
  
  // Check for SQL injection vulnerabilities
  if (code.includes('SELECT') || code.includes('INSERT') || code.includes('UPDATE')) {
    errors.push(generateFix({
      type: 'security',
      message: 'Potential SQL injection vulnerability',
      line: code.split('\n').findIndex(line => line.includes('SELECT') || line.includes('INSERT') || line.includes('UPDATE')) + 1,
      fix: 'Use parameterized queries or prepared statements'
    }, language));
  }

  // Check for XSS vulnerabilities
  if (code.includes('innerHTML') || code.includes('document.write')) {
    errors.push(generateFix({
      type: 'security',
      message: 'Potential XSS vulnerability',
      line: code.split('\n').findIndex(line => line.includes('innerHTML') || line.includes('document.write')) + 1,
      fix: 'Use textContent instead of innerHTML or sanitize input'
    }, language));
  }

  return errors;
};

// Code analysis functions
const analyzeCode = (code, language) => {
  const lines = code.split('\n');
  const totalLines = lines.length;
  
  // Count comments
  const commentLines = lines.filter(line => 
    line.trim().startsWith('//') || 
    line.trim().startsWith('/*') || 
    line.trim().startsWith('*') || 
    line.trim().startsWith('#')
  ).length;

  // Count functions
  const functionCount = lines.filter(line => 
    line.includes('function') || 
    line.includes('def ') || 
    line.includes('class ')
  ).length;

  // Calculate complexity based on multiple factors
  const complexity = calculateComplexity(code, language);

  // Generate language-specific suggestions
  const suggestions = generateSuggestions(code, language);

  // Generate best practices based on language
  const bestPractices = generateBestPractices(language);

  // Add debugging analysis
  const potentialBugs = analyzePotentialBugs(code, language);

  return {
    codeAnalysis: {
      language,
      totalLines,
      commentLines,
      functionCount,
      complexity,
      codeToCommentRatio: (commentLines / totalLines) * 100
    },
    suggestions,
    bestPractices,
    metrics: {
      maintainability: calculateMaintainability(code),
      readability: calculateReadability(code),
      efficiency: calculateEfficiency(code)
    },
    debugging: {
      bugs: potentialBugs,
      bugCount: potentialBugs.length,
      bugTypes: {
        syntax: potentialBugs.filter(bug => bug.type === 'syntax').length,
        runtime: potentialBugs.filter(bug => bug.type === 'runtime').length,
        logical: potentialBugs.filter(bug => bug.type === 'logical').length,
        security: potentialBugs.filter(bug => bug.type === 'security').length
      }
    }
  };
};

const calculateComplexity = (code, language) => {
  const lines = code.split('\n');
  let complexity = 0;

  // Count control structures
  complexity += (code.match(/if|else|for|while|switch|catch/g) || []).length;
  
  // Count nested structures
  complexity += (code.match(/\{/g) || []).length;
  
  // Count function parameters
  complexity += (code.match(/\([^)]*\)/g) || []).length;

  if (complexity > 20) return 'High';
  if (complexity > 10) return 'Medium';
  return 'Low';
};

const calculateMaintainability = (code) => {
  const lines = code.split('\n');
  const avgLineLength = lines.reduce((acc, line) => acc + line.length, 0) / lines.length;
  const longLines = lines.filter(line => line.length > 80).length;
  
  if (avgLineLength > 100 || longLines > lines.length * 0.2) return 'Low';
  if (avgLineLength > 80 || longLines > lines.length * 0.1) return 'Medium';
  return 'High';
};

const calculateReadability = (code) => {
  const lines = code.split('\n');
  const indentationConsistency = lines.every(line => 
    line.startsWith('  ') || line.startsWith('\t') || !line.trim()
  );
  
  const variableNaming = code.match(/[a-z][a-zA-Z0-9]*/g) || [];
  const descriptiveNames = variableNaming.filter(name => name.length > 3).length;
  
  if (!indentationConsistency || descriptiveNames < variableNaming.length * 0.7) return 'Low';
  if (descriptiveNames < variableNaming.length * 0.9) return 'Medium';
  return 'High';
};

const calculateEfficiency = (code) => {
  const lines = code.split('\n');
  const loops = (code.match(/for|while/g) || []).length;
  const nestedLoops = (code.match(/for.*for|while.*while/g) || []).length;
  
  if (nestedLoops > 0) return 'Low';
  if (loops > lines.length * 0.2) return 'Medium';
  return 'High';
};

const generateSuggestions = (code, language) => {
  const suggestions = [];
  
  // Check for comments and documentation
  if (!code.includes('//') && !code.includes('/*')) {
    suggestions.push({
      message: 'Add comments to explain complex logic and important sections',
      example: {
        before: 'function calculateTotal(items) {\n    return items.reduce((sum, item) => sum + item.price, 0);\n}',
        after: '// Calculate the total price of all items in the cart\nfunction calculateTotal(items) {\n    // Use reduce to sum up all item prices\n    return items.reduce((sum, item) => sum + item.price, 0);\n}'
      }
    });
  }

  // Check for error handling
  if (!code.includes('try') && !code.includes('catch')) {
    suggestions.push({
      message: 'Implement proper error handling with try-catch blocks',
      example: {
        before: 'function divide(a, b) {\n    return a / b;\n}',
        after: 'function divide(a, b) {\n    try {\n        if (b === 0) throw new Error("Division by zero");\n        return a / b;\n    } catch (error) {\n        console.error("Error:", error.message);\n        return null;\n    }\n}'
      }
    });
  }

  // Check for consistent formatting
  if (code.includes('  ') && code.includes('\t')) {
    suggestions.push({
      message: 'Use consistent indentation (either spaces or tabs, not both)',
      example: {
        before: 'function example() {\n\tconsole.log("tab");\n  console.log("spaces");\n}',
        after: 'function example() {\n    console.log("consistent");\n    console.log("spaces");\n}'
      }
    });
  }

  // Check for variable naming
  const variableNames = code.match(/[a-z][a-zA-Z0-9]*/g) || [];
  const shortNames = variableNames.filter(name => name.length < 3);
  if (shortNames.length > 0) {
    suggestions.push({
      message: 'Use more descriptive variable names (avoid single or double letter names)',
      example: {
        before: 'let x = 5;\nlet y = 10;\nlet z = x + y;',
        after: 'let firstNumber = 5;\nlet secondNumber = 10;\nlet sum = firstNumber + secondNumber;'
      }
    });
  }

  // Language-specific suggestions
  switch (language) {
    case 'javascript':
      if (code.includes('var ')) {
        suggestions.push({
          message: 'Use const or let instead of var for better scoping',
          example: {
            before: 'var counter = 0;\nvar name = "John";',
            after: 'const name = "John";\nlet counter = 0;'
          }
        });
      }
      if (code.includes('function()') || code.includes('function ()')) {
        suggestions.push({
          message: 'Consider using arrow functions for better readability',
          example: {
            before: 'function multiply(a, b) {\n    return a * b;\n}',
            after: 'const multiply = (a, b) => a * b;'
          }
        });
      }
      if (code.includes('==') || code.includes('!=')) {
        suggestions.push({
          message: 'Use strict equality operators (=== and !==) instead of loose equality',
          example: {
            before: 'if (value == "5") {\n    console.log("Equal");\n}',
            after: 'if (value === "5") {\n    console.log("Equal");\n}'
          }
        });
      }
      break;

    case 'python':
      if (code.includes('print(')) {
        suggestions.push({
          message: 'Consider using logging instead of print statements',
          example: {
            before: 'print("Error occurred")',
            after: 'import logging\nlogging.error("Error occurred")'
          }
        });
      }
      if (code.includes('global ')) {
        suggestions.push({
          message: 'Avoid using global variables, consider passing values as parameters',
          example: {
            before: 'global counter\ndef increment():\n    global counter\n    counter += 1',
            after: 'def increment(counter):\n    return counter + 1'
          }
        });
      }
      break;

    case 'java':
      if (!code.includes('public class')) {
        suggestions.push({
          message: 'Add proper access modifiers to classes and methods',
          example: {
            before: 'class Calculator {\n    int add(int a, int b) {\n        return a + b;\n    }\n}',
            after: 'public class Calculator {\n    public int add(int a, int b) {\n        return a + b;\n    }\n}'
          }
        });
      }
      break;

    case 'cpp':
      if (code.includes('using namespace std;')) {
        suggestions.push({
          message: 'Avoid using namespace std, use specific using declarations instead',
          example: {
            before: 'using namespace std;\ncout << "Hello";',
            after: 'using std::cout;\ncout << "Hello";'
          }
        });
      }
      break;
  }

  // Performance suggestions
  if (code.includes('for') && code.includes('for')) {
    suggestions.push({
      message: 'Consider optimizing nested loops for better performance',
      example: {
        before: 'for (let i = 0; i < array.length; i++) {\n    for (let j = 0; j < array.length; j++) {\n        console.log(array[i][j]);\n    }\n}',
        after: 'const length = array.length;\nfor (let i = 0; i < length; i++) {\n    for (let j = 0; j < length; j++) {\n        console.log(array[i][j]);\n    }\n}'
      }
    });
  }

  // Security suggestions
  if (code.includes('eval(') || code.includes('Function(')) {
    suggestions.push({
      message: 'Avoid using eval() or Function() constructor as they can lead to security vulnerabilities',
      example: {
        before: 'eval(userInput);',
        after: '// Use safer alternatives\nconst result = parseFloat(userInput);\nif (!isNaN(result)) {\n    // Process the number\n}'
      }
    });
  }

  return suggestions;
};

const generateBestPractices = (language) => {
  const practices = {
    javascript: [
      'Use const for values that won\'t be reassigned',
      'Use arrow functions for callbacks',
      'Implement proper error handling',
      'Use template literals for string interpolation',
      'Follow the principle of least privilege'
    ],
    python: [
      'Follow PEP 8 style guide',
      'Use virtual environments',
      'Implement proper exception handling',
      'Use type hints for better code clarity',
      'Write docstrings for functions and classes'
    ],
    java: [
      'Follow Java naming conventions',
      'Use appropriate access modifiers',
      'Implement proper exception handling',
      'Use interfaces for abstraction',
      'Follow SOLID principles'
    ],
    cpp: [
      'Use smart pointers instead of raw pointers',
      'Follow RAII principles',
      'Use const where appropriate',
      'Implement proper memory management',
      'Use modern C++ features'
    ]
  };

  return practices[language] || practices.javascript;
};

// Routes
app.post('/api/review', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (!language) {
      return res.status(400).json({ error: 'Programming language is required' });
    }

    const review = analyzeCode(code, language);
    res.json({ review });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to review code'
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});