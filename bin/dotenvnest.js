#!/usr/bin/env node
/* eslint-disable */

"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const BASE_URL = process.env.DOTENVNEST_URL || "http://localhost:3000";
const args = process.argv.slice(2);
const subcommand = args[0];

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
  \x1b[1mDotEnvNest CLI\x1b[0m  —  Secure .env manager

  \x1b[33mUsage:\x1b[0m
    dotenvnest pull  <project>              Download .env from DotEnvNest
    dotenvnest push  <project>              Upload local .env to DotEnvNest
    dotenvnest run   <project> -- <cmd>     Inject env vars and run a command

  \x1b[33mOptions:\x1b[0m
    --output,  -o   Output file for pull (default: .env)
    --file,    -f   Source file for push (default: .env)
    --force         Skip confirmation prompts

  \x1b[33mExamples:\x1b[0m
    dotenvnest pull my-app
    dotenvnest pull my-app --output .env.local
    dotenvnest push my-app
    dotenvnest push my-app --file .env.local
    dotenvnest run  my-app -- npm run dev

  \x1b[33mEnvironment variables:\x1b[0m
    DOTENVNEST_URL       Server URL (default: http://localhost:3000)
    DOTENVNEST_API_KEY   Your CLI API key (from Account page, for \`run\`)
`);
}

// ─── Arg helpers ────────────────────────────────────────────────────────────
function getArg(flags) {
  for (const flag of flags) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && idx < args.length - 1) return args[idx + 1];
  }
  return null;
}

function hasFlag(flags) {
  return flags.some((f) => args.includes(f));
}

// Returns project name from positional arg (args[1]) or --project / -p flag
function getProject() {
  // Positional: first arg after the subcommand that isn't a flag
  const positional = args[1] && !args[1].startsWith("-") ? args[1] : null;
  return positional || getArg(["--project", "-p"]);
}

// ─── Prompt helpers ───────────────────────────────────────────────────────────
function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptPassword(question) {
  return new Promise((resolve) => {
    const output = process.stdout;
    output.write(question);

    let password = "";
    const onData = (char) => {
      const str = char.toString();
      if (str === "\r" || str === "\n" || str === "\u0004") {
        // Enter or EOF
        process.stdin.setRawMode(false);
        process.stdin.removeListener("data", onData);
        process.stdin.pause();
        output.write("\n");
        resolve(password);
      } else if (str === "\u0003") {
        // Ctrl+C
        output.write("\n");
        process.exit(0);
      } else if (str === "\u007f" || str === "\b") {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          output.write("\b \b");
        }
      } else {
        password += str;
        output.write("*");
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

// ─── RUN command ──────────────────────────────────────────────────────────────
async function runCommand() {
  const projectName = getProject();
  if (!projectName) {
    console.error("\x1b[31mError:\x1b[0m project name is required.");
    console.error("Usage: dotenvnest run <project> -- <command>");
    process.exit(1);
  }

  // Find the '--' separator and extract the user command
  const separatorIdx = args.indexOf("--");
  if (separatorIdx === -1 || separatorIdx >= args.length - 1) {
    console.error("\x1b[31mError:\x1b[0m No command provided after --");
    console.error("Usage: dotenvnest run <project> -- <command>");
    process.exit(1);
  }

  const userArgs = args.slice(separatorIdx + 1);
  const command = userArgs[0];
  const commandArgs = userArgs.slice(1);

  const apiKey = process.env.DOTENVNEST_API_KEY;
  if (!apiKey) {
    console.error("\x1b[31mError:\x1b[0m DOTENVNEST_API_KEY is not set.");
    console.error("Get your key from the Account page and run:");
    console.error("  export DOTENVNEST_API_KEY=<your-key>");
    process.exit(1);
  }

  const fetchUrl = new URL(
    `/api/cli?project=${encodeURIComponent(projectName)}`,
    BASE_URL
  ).toString();

  process.stdout.write(
    `\x1b[2m[DotEnvNest]\x1b[0m Fetching env for \x1b[36m${projectName}\x1b[0m… `
  );

  try {
    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      process.stdout.write("\x1b[31m✗\x1b[0m\n");
      console.error(
        `\x1b[31mError ${res.status}:\x1b[0m ${data.error || "Failed to fetch env."}`
      );
      process.exit(1);
    }

    const { envContent } = await res.json();
    process.stdout.write("\x1b[32m✓\x1b[0m\n");

    // Parse env vars
    const envVars = parseEnv(envContent);
    const finalEnv = { ...process.env, ...envVars };

    console.log(
      `\x1b[2m[DotEnvNest]\x1b[0m Injected \x1b[33m${Object.keys(envVars).length}\x1b[0m variable(s) → \x1b[36m${command}\x1b[0m`
    );

    const child = spawn(command, commandArgs, {
      env: finalEnv,
      stdio: "inherit",
      shell: true,
    });
    child.on("error", (err) => {
      console.error(`\x1b[31mFailed to start:\x1b[0m ${err.message}`);
    });
    child.on("exit", (code) => {
      process.exit(code || 0);
    });
  } catch (e) {
    process.stdout.write("\x1b[31m✗\x1b[0m\n");
    console.error(`\x1b[31mConnection error:\x1b[0m ${e.message}`);
    process.exit(1);
  }
}

// ─── PULL command ─────────────────────────────────────────────────────────────
async function pullCommand() {
  const projectName = getProject();
  if (!projectName) {
    console.error("\x1b[31mError:\x1b[0m project name is required.");
    console.error("Usage: dotenvnest pull <project>");
    process.exit(1);
  }

  const outputFile = getArg(["--output", "-o"]) || ".env";
  const outputPath = path.resolve(process.cwd(), outputFile);
  const force = hasFlag(["--force"]);

  console.log(`\n\x1b[1m  DotEnvNest — Secure Pull\x1b[0m`);
  console.log(`  \x1b[2mProject:\x1b[0m \x1b[36m${projectName}\x1b[0m`);
  console.log(`  \x1b[2mOutput:\x1b[0m  \x1b[33m${outputPath}\x1b[0m\n`);

  // ── Prompt credentials ─────────────────────────────────────────────────────
  let email, password;
  try {
    email = await prompt("  \x1b[2mEmail:\x1b[0m    ");
    if (!email) {
      console.error("\x1b[31mError:\x1b[0m Email is required.");
      process.exit(1);
    }

    password = await promptPassword("  \x1b[2mPassword:\x1b[0m ");
    if (!password) {
      console.error("\x1b[31mError:\x1b[0m Password is required.");
      process.exit(1);
    }
  } catch (e) {
    console.error("\n\x1b[31mInterrupted.\x1b[0m");
    process.exit(1);
  }

  // ── Check if output file exists ────────────────────────────────────────────
  if (!force && fs.existsSync(outputPath)) {
    const overwrite = await prompt(
      `\n  \x1b[33m⚠ ${outputFile} already exists. Overwrite? [y/N]\x1b[0m `
    );
    if (!overwrite.toLowerCase().startsWith("y")) {
      console.log("  Aborted.");
      process.exit(0);
    }
  }

  // ── Authenticate & fetch ───────────────────────────────────────────────────
  process.stdout.write("\n  \x1b[2m[DotEnvNest]\x1b[0m Authenticating… ");

  const pullUrl = new URL("/api/cli/pull", BASE_URL).toString();

  try {
    const res = await fetch(pullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password,
        projectName,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      process.stdout.write("\x1b[31m✗\x1b[0m\n");
      if (res.status === 401) {
        console.error(`  \x1b[31mInvalid email or password.\x1b[0m`);
      } else if (res.status === 403) {
        console.error(`  \x1b[31m${data.error || "Access denied."}\x1b[0m`);
      } else if (res.status === 404) {
        console.error(
          `  \x1b[31m${data.error || `Project "${projectName}" not found.`}\x1b[0m`
        );
      } else if (res.status === 429) {
        console.error(
          `  \x1b[31mToo many attempts. Please wait before trying again.\x1b[0m`
        );
      } else {
        console.error(
          `  \x1b[31mError ${res.status}:\x1b[0m ${data.error || "Unknown error."}`
        );
      }
      process.exit(1);
    }

    process.stdout.write("\x1b[32m✓\x1b[0m\n");

    const { envContent, keyCount } = data;

    // ── Write the file ─────────────────────────────────────────────────────
    fs.writeFileSync(outputPath, envContent, { encoding: "utf8", mode: 0o600 });

    console.log(
      `  \x1b[32m✓ Downloaded\x1b[0m \x1b[33m${keyCount}\x1b[0m variable(s) → \x1b[36m${outputFile}\x1b[0m`
    );
    console.log(
      `  \x1b[2mFile permissions set to 600 (owner read/write only)\x1b[0m\n`
    );
  } catch (e) {
    process.stdout.write("\x1b[31m✗\x1b[0m\n");
    console.error(`  \x1b[31mConnection error:\x1b[0m ${e.message}`);
    process.exit(1);
  }
}

// ─── PUSH command ────────────────────────────────────────────────────────────
async function pushCommand() {
  const projectName = getProject();
  if (!projectName) {
    console.error("\x1b[31mError:\x1b[0m project name is required.");
    console.error("Usage: dotenvnest push <project>");
    process.exit(1);
  }

  const inputFile = getArg(["--file", "-f"]) || ".env";
  const inputPath = path.resolve(process.cwd(), inputFile);
  const force = hasFlag(["--force"]);

  // ── Check file exists ────────────────────────────────────────────────────
  if (!fs.existsSync(inputPath)) {
    console.error(`\x1b[31mError:\x1b[0m File not found: ${inputPath}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(inputPath, "utf8").trim();
  if (!envContent) {
    console.error(`\x1b[31mError:\x1b[0m File is empty: ${inputFile}`);
    process.exit(1);
  }

  // Count non-comment, non-empty key=value lines
  const keyCount = envContent.split("\n").filter((l) => {
    const t = l.trim();
    return t && !t.startsWith("#") && t.includes("=");
  }).length;

  console.log(`\n\x1b[1m  DotEnvNest — Secure Push\x1b[0m`);
  console.log(`  \x1b[2mProject:\x1b[0m \x1b[36m${projectName}\x1b[0m`);
  console.log(`  \x1b[2mSource:\x1b[0m  \x1b[33m${inputPath}\x1b[0m`);
  console.log(
    `  \x1b[2mKeys:\x1b[0m    \x1b[33m${keyCount}\x1b[0m variable(s) found\n`
  );

  // ── Confirm unless --force ──────────────────────────────────────────────
  if (!force) {
    const confirm = await prompt(
      `  \x1b[33mPush "${inputFile}" → project "${projectName}"? [y/N]\x1b[0m `
    );
    if (!confirm.toLowerCase().startsWith("y")) {
      console.log("  Aborted.");
      process.exit(0);
    }
  }

  // ── Prompt credentials ──────────────────────────────────────────────────
  let email, password;
  try {
    email = await prompt("  \x1b[2mEmail:\x1b[0m    ");
    if (!email) {
      console.error("\x1b[31mError:\x1b[0m Email is required.");
      process.exit(1);
    }

    password = await promptPassword("  \x1b[2mPassword:\x1b[0m ");
    if (!password) {
      console.error("\x1b[31mError:\x1b[0m Password is required.");
      process.exit(1);
    }
  } catch (e) {
    console.error("\n\x1b[31mInterrupted.\x1b[0m");
    process.exit(1);
  }

  // ── Authenticate & upload ───────────────────────────────────────────────
  process.stdout.write("\n  \x1b[2m[DotEnvNest]\x1b[0m Uploading… ");

  const pushUrl = new URL("/api/cli/push", BASE_URL).toString();

  try {
    const res = await fetch(pushUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password,
        projectName,
        envContent,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      process.stdout.write("\x1b[31m✗\x1b[0m\n");
      if (res.status === 401) {
        console.error(`  \x1b[31mInvalid email or password.\x1b[0m`);
      } else if (res.status === 403) {
        console.error(`  \x1b[31m${data.error || "Access denied."}\x1b[0m`);
      } else if (res.status === 429) {
        console.error(
          `  \x1b[31mToo many attempts. Please wait before trying again.\x1b[0m`
        );
      } else {
        console.error(
          `  \x1b[31mError ${res.status}:\x1b[0m ${data.error || "Unknown error."}`
        );
      }
      process.exit(1);
    }

    process.stdout.write("\x1b[32m✓\x1b[0m\n");

    const action = data.created
      ? "\x1b[32mCreated\x1b[0m"
      : "\x1b[34mUpdated\x1b[0m";
    console.log(
      `  ${action} project \x1b[36m${projectName}\x1b[0m with \x1b[33m${keyCount}\x1b[0m variable(s)`
    );
    console.log(`  \x1b[2mEncrypted and stored securely.\x1b[0m\n`);
  } catch (e) {
    process.stdout.write("\x1b[31m✗\x1b[0m\n");
    console.error(`  \x1b[31mConnection error:\x1b[0m ${e.message}`);
    process.exit(1);
  }
}

// ─── Parse env content ────────────────────────────────────────────────────────
function parseEnv(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

// ─── Router ───────────────────────────────────────────────────────────────────
(async () => {
  switch (subcommand) {
    case "run":
      await runCommand();
      break;
    case "pull":
      await pullCommand();
      break;
    case "push":
      await pushCommand();
      break;
    case "--help":
    case "-h":
    case "help":
    case undefined:
      printHelp();
      break;
    default:
      console.error(`\x1b[31mUnknown subcommand:\x1b[0m "${subcommand}"`);
      printHelp();
      process.exit(1);
  }
})();
