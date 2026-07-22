import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function shareCommand(program: Command) {
  program
    .command("share <project-name> <email>")
    .description("Share a project with another user")
    .option("--access <level>", "Access level (read or edit)", "read")
    .action(async (projectName, email, options) => {
      const config = readConfig();
      if (!config.token) {
        console.log(chalk.red("You are not logged in. Please run ") + chalk.cyan("dotenvnest login") + chalk.red(" first."));
        return;
      }

      const access = options.access === "edit" ? "edit" : "read";
      const normalizedProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

      const spinner = ora(`Sharing project ${chalk.bold(normalizedProjectName)} with ${email}...`).start();

      try {
        const res = await api.post("/share", {
          projectName: normalizedProjectName,
          email,
          access
        });
        
        spinner.succeed(chalk.green(res.data.message));
      } catch (error: any) {
        spinner.fail(chalk.red("Failed to share project."));
        console.log(chalk.red(`Error: ${getApiError(error)}`));
      }
    });
}
