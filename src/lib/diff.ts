export interface EnvDiff {
  key: string;
  oldValue?: string;
  newValue?: string;
  status: "added" | "removed" | "changed" | "unchanged";
}

function parseEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const value = trimmed.substring(eqIdx + 1).trim();
      env[key] = value;
    }
  }
  return env;
}

export function computeDiff(oldContent: string, newContent: string): EnvDiff[] {
  const oldEnv = parseEnv(oldContent);
  const newEnv = parseEnv(newContent);

  const allKeys = Array.from(
    new Set([...Object.keys(oldEnv), ...Object.keys(newEnv)])
  ).sort();

  return allKeys.map((key) => {
    const oldValue = oldEnv[key];
    const newValue = newEnv[key];

    let status: EnvDiff["status"];
    if (oldValue === undefined) {
      status = "added";
    } else if (newValue === undefined) {
      status = "removed";
    } else if (oldValue !== newValue) {
      status = "changed";
    } else {
      status = "unchanged";
    }

    return { key, oldValue, newValue, status };
  });
}
