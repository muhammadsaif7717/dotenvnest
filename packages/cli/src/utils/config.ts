import fs from "fs";
import os from "os";
import path from "path";

const CONFIG_PATH = path.join(os.homedir(), ".dotenvnest-config.json");

interface Config {
  token?: string;
}

export function saveConfig(config: Config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
  } catch (error) {
    console.error("Failed to save config:", error);
  }
}

export function readConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    // ignore
  }
  return {};
}

export function deleteConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }
  } catch (error) {
    console.error("Failed to delete config:", error);
  }
}
