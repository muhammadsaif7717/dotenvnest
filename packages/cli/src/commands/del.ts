import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function delCommand(program: Command) {
  program
    .command("del <project-name>")
    .alias("delete")
    .description("Delete a project from Dotenvnest")
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
          message: `Are you sure you want to completely delete project ${chalk.bold.red(finalProjectName)}? This action cannot be undone.`,
          default: false,
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow("Deletion cancelled."));
        return;
      }

      const spinner = ora(`Deleting project ${chalk.bold(finalProjectName)}...`).start();

      try {
        await api.delete("/delete", {
          data: { projectName: finalProjectName }
        });
        
        spinner.succeed(chalk.green(`Successfully deleted project ${finalProjectName}!`));
      } catch (error: any) {
        spinner.fail(chalk.red("Deletion failed."));
        const message = getApiError(error);
        console.log(chalk.red(`Error: ${message}`));
        if (error.response?.status === 401) {
          console.log(chalk.yellow("Your session might be expired. Try running 'dotenvnest login' again."));
        }
      }
    });
}
