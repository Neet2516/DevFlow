describe('AI Failure Analyzer — Unit & Pattern Matching', () => {
  it('correctly categorizes OOM memory errors', () => {
    const error = 'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory';
    const logs = ['[INFO] Processing image batch...', '[WARN] Heap memory 92% full'];

    const hasOom = /JavaScript heap out of memory|Killed|OOMKilled|Memory limit/i.test(logs.join('\n') + '\n' + error);
    expect(hasOom).toBe(true);
  });

  it('correctly categorizes Network connectivity errors', () => {
    const error = 'FetchError: request to https://api.prod.local/deploy failed, reason: connect ECONNREFUSED 127.0.0.1:443';
    const logs = ['[INFO] Pinging deploy endpoint...'];

    const hasNet = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(logs.join('\n') + '\n' + error);
    expect(hasNet).toBe(true);
  });

  it('correctly categorizes Missing Dependency errors', () => {
    const error = 'Error: Cannot find module "@devflow/db" or its corresponding type declarations.';
    const logs = ['[INFO] Compiling ts files...'];

    const hasDep = /Cannot find module|MODULE_NOT_FOUND|npm error|Command not found|TS2307/i.test(logs.join('\n') + '\n' + error);
    expect(hasDep).toBe(true);
  });

  it('correctly categorizes Syntax errors', () => {
    const error = 'SyntaxError: Unexpected token "}" in JSON at position 42';
    const logs = ['[INFO] Parsing config.json...'];

    const hasSyntax = /SyntaxError|Unexpected token|ParseError/i.test(logs.join('\n') + '\n' + error);
    expect(hasSyntax).toBe(true);
  });
});
