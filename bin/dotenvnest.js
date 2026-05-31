#!/usr/bin/env node
/* eslint-disable */

const { spawn } = require('child_process');
const http = require('http');

const args = process.argv.slice(2);

let projectIndex = args.indexOf('--project');
if (projectIndex === -1) {
  projectIndex = args.indexOf('-p');
}

if (projectIndex === -1 || projectIndex >= args.length - 1) {
  console.error("Usage: dotenvnest run --project <project-name> -- <command>");
  process.exit(1);
}

const projectName = args[projectIndex + 1];

// Remove '--project <name>' from args
args.splice(projectIndex, 2);

// If there's a 'run' command, remove it
if (args[0] === 'run') {
  args.shift();
}

// If there's a '--' separator, remove it
if (args[0] === '--') {
  args.shift();
}

if (args.length === 0) {
  console.error("Please provide a command to run.");
  process.exit(1);
}

const command = args[0];
const commandArgs = args.slice(1);

const fetchUrl = new URL(`/api/cli?project=${encodeURIComponent(projectName)}`, process.env.DOTENVNEST_URL || 'https://dotenvnest-two.vercel.app').toString();

const apiKey = process.env.DOTENVNEST_API_KEY;
if (!apiKey) {
  console.error("Error: DOTENVNEST_API_KEY is not set. Please export DOTENVNEST_API_KEY=<your_cli_secret>.");
  process.exit(1);
}

fetch(fetchUrl, {
  headers: {
    "Authorization": `Bearer ${apiKey}`
  }
})
  .then(async (res) => {
    if (!res.ok) {
      console.error(`Error: Failed to fetch env for project '${projectName}'. Status code: ${res.status}`);
      process.exit(1);
    }
    const parsedData = await res.json();
    if (!parsedData.envContent) {
      console.error("Invalid response from DotEnvNest server.");
      process.exit(1);
    }

    // Parse the .env content
    const envVars = {};
    const lines = parsedData.envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let value = trimmed.substring(eqIdx + 1).trim();
        // Remove surrounding quotes if any
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        envVars[key] = value;
      }
    }

    // Merge with process.env
    const finalEnv = { ...process.env, ...envVars };

    console.log(`[DotEnvNest] Injected ${Object.keys(envVars).length} variables into '${command}'.`);

    const child = spawn(command, commandArgs, {
      env: finalEnv,
      stdio: 'inherit',
      shell: true // Allows running things like 'npm run dev' on Windows/Mac smoothly
    });

    child.on('error', (err) => {
      console.error(`Failed to start command: ${err.message}`);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  })
  .catch((e) => {
    console.error(`Error connecting to DotEnvNest: ${e.message}`);
    console.error("Check your network connection and the DotEnvNest server.");
    process.exit(1);
  });
