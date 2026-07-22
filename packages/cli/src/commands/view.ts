import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function viewCommand(program: Command) {
  program
    .command("view <project-name>")
    .description("View the environment variables of a project in your terminal")
    .option(
      "--owner <email>",
      "Specify the owner email if viewing a shared project (in case of name collision)"
    )
    .action(async (projectName, options) => {
      const config = readConfig();
      if (!config.token) {
        console.log(
          chalk.red("You are not logged in. Please run ") +
            chalk.cyan("dotenvnest login") +
            chalk.red(" first.")
        );
        return;
      }

      const finalProjectName = projectName.trim();
      const spinner = ora(
        `Fetching variables for ${chalk.bold(finalProjectName)}...`
      ).start();

      try {
        const response = await api.get("/pull", {
          params: {
            projectName: finalProjectName,
            ...(options.owner && { ownerEmail: options.owner }),
          },
        });

        spinner.succeed(
          chalk.green(`Successfully fetched variables for ${finalProjectName}`)
        );

        const envContent = response.data.envContent;

        if (!envContent || envContent.trim() === "") {
          console.log(
            chalk.yellow(
              "\nThis project has no environment variables saved yet."
            )
          );
          return;
        }

        console.log(
          boxen(envContent, {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "green",
            title: ` ${chalk.bold.cyan(finalProjectName)} `,
            titleAlignment: "center",
          })
        );
      } catch (error: any) {
        spinner.fail(chalk.red("Failed to view project."));
        const message = getApiError(error);
        console.log(chalk.red(`Error: ${message}`));
        if (error.response?.status === 401) {
          console.log(
            chalk.yellow(
              "Your session might be expired. Try running 'dotenvnest login' again."
            )
          );
        }
      }
    });
}
