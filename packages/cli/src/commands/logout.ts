import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { deleteConfig, readConfig } from "../utils/config";

export function logoutCommand(program: Command) {
  program
    .command("logout")
    .description("Log out from Dotenvnest")
    .action(() => {
      const config = readConfig();
      if (!config.token) {
        console.log(chalk.yellow("You are not currently logged in."));
        return;
      }

      const spinner = ora("Logging out...").start();
      deleteConfig();
      spinner.succeed("Successfully logged out.");
    });
}
