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
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Code Execution
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={
            loading ? <CircularProgress size={20} /> : <PlayArrowIcon />
          }
          onClick={executeCode}
          disabled={loading}
        >
          {loading ? "Executing..." : "Execute Code"}
        </Button>
      </Box>
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      {result && (
        <Box sx={{ mt: 2 }}>
          <Button
            onClick={() => setExpanded(!expanded)}
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {expanded ? "Hide Output" : "Show Output"}
          </Button>
          <Collapse in={expanded}>
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: "grey.900" }}>
              <Typography variant="subtitle1" gutterBottom>
                Output:
              </Typography>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "white",
                }}
              >
                {result.stdout ||
                  result.stderr ||
                  result.compile_output ||
                  result.message}
              </pre>
              <Typography variant="body2" sx={{ mt: 1, color: "grey.400" }}>
                Execution time: {result.time} | Memory used: {result.memory}
              </Typography>
            </Paper>
          </Collapse>
        </Box>
      )}
    </Paper>
  );
};

export default CodeExecutionEnvironment;
