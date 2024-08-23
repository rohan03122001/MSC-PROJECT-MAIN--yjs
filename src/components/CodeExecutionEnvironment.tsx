import React, { useState } from "react";
import axios from "axios";
import {
  CodeExecutionEnvironmentProps,
  ExecutionResult,
  getErrorMessage,
} from "@/types";
import {
  Button,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Collapse,
  IconButton,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

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
  const [expanded, setExpanded] = useState(false);

  const executeCode = async () => {
    setLoading(true);
    setError(null);
    try {
      // Add language-specific settings
      let languageSettings = {};
      if (language === "python") {
        languageSettings = { language_id: 71 };
      } else if (language === "java") {
        languageSettings = { language_id: 62, stdin: "" };
      } else if (language === "go") {
        languageSettings = { language_id: 60 };
      } else {
        // Default to JavaScript
        languageSettings = { language_id: 63 };
      }

      const response = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions",
        {
          source_code: code,
          ...languageSettings,
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
      setExpanded(true);
    } catch (err) {
      setError("An error occurred while executing the code.");
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <PlayArrowIcon />
          )
        }
        onClick={executeCode}
        disabled={loading}
        fullWidth
        size="small"
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
          <Button
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ color: "text.secondary" }}
            size="small"
          >
            {expanded ? "Hide Output" : "Show Output"}
          </Button>
          <Collapse in={expanded}>
            <Paper
              variant="outlined"
              sx={{ p: 2, mt: 2, bgcolor: "background.default" }}
            >
              <Typography variant="subtitle2" gutterBottom color="primary">
                Output:
              </Typography>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "inherit",
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: "0.8rem",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {result.stdout ||
                  result.stderr ||
                  result.compile_output ||
                  result.message}
              </pre>
              <Typography
                variant="caption"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                Execution time: {result.time} | Memory used: {result.memory}
              </Typography>
            </Paper>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default CodeExecutionEnvironment;
