

const loadMonacoLanguages = () => {
  if (typeof window !== "undefined") {
    require("monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution");
    require("monaco-editor/esm/vs/basic-languages/python/python.contribution");
    require("monaco-editor/esm/vs/basic-languages/java/java.contribution");
    require("monaco-editor/esm/vs/basic-languages/go/go.contribution");
  }
};

export default loadMonacoLanguages;
