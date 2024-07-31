import React, { useState } from "react";
import axios from "axios";
import {
  CodeExecutionEnvironmentProps,
  ExecutionResult,
  getErrorMessage,
} from "@/types";

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
    <div className="mt-6 p-6 bg-white rounded-lg shadow-md space-y-4">
      <h3 className="text-xl font-semibold">Code Execution</h3>
      <button
        onClick={executeCode}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors w-full"
        disabled={loading}
      >
        {loading ? "Executing..." : "Execute Code"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {result && (
        <div className="space-y-2">
          <h4 className="font-semibold">Output:</h4>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
            {result.stdout ||
              result.stderr ||
              result.compile_output ||
              result.message}
          </pre>
          <p>
            Execution time: {result.time} | Memory used: {result.memory}
          </p>
        </div>
      )}
    </div>
  );
};

export default CodeExecutionEnvironment;
