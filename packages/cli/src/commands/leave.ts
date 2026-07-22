import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function leaveCommand(program: Command) {
  program
    .command("leave <project-name>")
    .alias("exit")
    .description("Leave a project that has been shared with you")
    .action(async (projectName) => {
      const config = readConfig();
      if (!config.token) {
        console.log(chalk.red("You are not logged in. Please run ") + chalk.cyan("dotenvnest login") + chalk.red(" first."));
        return;
      }

      const finalProjectName = projectName.trim();

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Are you sure you want to leave the shared project ${chalk.bold.yellow(finalProjectName)}? You will lose access to its environment variables.`,
          default: false,
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow("Action cancelled."));
        return;
      }

      const spinner = ora(`Leaving project ${chalk.bold(finalProjectName)}...`).start();

      try {
        await api.post("/leave", { projectName: finalProjectName });
        
        spinner.succeed(chalk.green(`Successfully left project ${finalProjectName}!`));
      } catch (error: any) {
        spinner.fail(chalk.red("Failed to leave project."));
        const message = getApiError(error);
        console.log(chalk.red(`Error: ${message}`));
        if (error.response?.status === 401) {
          console.log(chalk.yellow("Your session might be expired. Try running 'dotenvnest login' again."));
        }
      }
    });
}
