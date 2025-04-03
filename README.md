# AI-Based Code Reviewer & Debugger

An intelligent tool that helps students debug their code and get suggestions to optimize performance using AI.

## Features

- Upload code snippets in multiple programming languages
- AI suggests possible bugs and solutions
- Performance optimization recommendations
- Explanation of code logic
- Best practices suggestions

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: MongoDB
- AI: OpenAI GPT-4 API
- Additional: PyTorch (for future AI model implementation)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- OpenAI API key

## Setup Instructions

1. Clone the repository
2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/ai-code-reviewer
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

6. Start the frontend development server:
   ```bash
   cd client
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Select your programming language
3. Paste your code in the text area
4. Click "Review Code" to get AI-powered feedback
5. Review the suggestions and recommendations provided by the AI

## Future Enhancements

- Implementation of custom PyTorch model for code analysis
- Support for more programming languages
- Code execution and testing capabilities
- User authentication and history tracking
- Integration with popular IDEs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 