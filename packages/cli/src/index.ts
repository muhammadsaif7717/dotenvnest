#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { delCommand } from "./commands/del";
import { docsCommand } from "./commands/docs";
import { findCommand } from "./commands/find";
import { leaveCommand } from "./commands/leave";
import { loginCommand } from "./commands/login";
import { logoutCommand } from "./commands/logout";
import { pullCommand } from "./commands/pull";
import { pushCommand } from "./commands/push";
import { shareCommand } from "./commands/share";
import { unshareCommand } from "./commands/unshare";
import { viewCommand } from "./commands/view";
import { diffCommand } from "./commands/diff";

// Import package.json using require to avoid module resolution issues
const pkg = require("../package.json");

const program = new Command();

program
  .name("dotenvnest")
  .description(
    chalk.hex("#10b981")(
      "Dotenvnest CLI - Securely manage your .env files across projects"
    )
  )
  .version(pkg.version);

// Override help to point to docs
program.on("--help", () => {
  console.log("");
  console.log(
    chalk.bold("For more detailed documentation, visit: ") +
      chalk.cyan.underline("https://dotenvnest.vercel.app/docs")
  );
  console.log(
    chalk.gray("Or run ") +
      chalk.cyan("dotenvnest docs") +
      chalk.gray(" to open the docs in your browser.")
  );
});

// Setup commands
loginCommand(program);
pushCommand(program);
pullCommand(program);
findCommand(program);
viewCommand(program);
diffCommand(program);
shareCommand(program);
unshareCommand(program);
leaveCommand(program);
docsCommand(program);
logoutCommand(program);
delCommand(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
