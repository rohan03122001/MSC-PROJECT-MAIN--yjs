import React, { useState } from "react";
import axios from "axios";
import {
  CodeExecutionEnvironmentProps,
  ExecutionResult,
  getErrorMessage,
} from "@/types";
import { Button, Typography, Paper, Box } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

// Map of supported languages to their Judge0 language IDs
const languageIds: { [key: string]: number } = {
  javascript: 63,
  python: 71,
  java: 62,
  go: 60,
};

const CodeExecutionEnvironment: React.FC<CodeExecutionEnvironmentProps> = ({
  code,
  language,
}) => {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeCode = async () => {
    setLoading(true);
    setError(null);
    try {
      // Submit code execution request
      const response = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions",
        {
          source_code: code,
          language_id: languageIds[language],
          stdin: "",
        },
        {
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
          },
        }
      );

      const token = response.data.token;

      // Poll for execution results
      let executionResult;
      do {
        const statusResponse = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
          {
            headers: {
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
              "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
            },
          }
        );
        executionResult = statusResponse.data;
      } while (executionResult.status.id <= 2);

      setResult(executionResult);
    } catch (err) {
      setError("An error occurred while executing the code.");
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Code Execution
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<PlayArrowIcon />}
        onClick={executeCode}
        disabled={loading}
        fullWidth
      >
        {loading ? "Executing..." : "Execute Code"}
      </Button>
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Output:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: "grey.900" }}>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {result.stdout ||
                result.stderr ||
                result.compile_output ||
                result.message}
            </pre>
          </Paper>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Execution time: {result.time} | Memory used: {result.memory}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CodeExecutionEnvironment;
