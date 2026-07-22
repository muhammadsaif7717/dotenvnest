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
      const finalProjectName = projectName.trim();

      const emails = email.split(",").map((e: string) => e.trim()).filter((e: string) => e.length > 0);

      for (const e of emails) {
        const spinner = ora(`Sharing project ${chalk.bold(finalProjectName)} with ${chalk.cyan(e)}...`).start();

        try {
          const res = await api.post("/share", {
            projectName: finalProjectName,
            email: e,
            access
          });
          
          spinner.succeed(chalk.green(res.data.message));
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to share project with ${e}.`));
          console.log(chalk.red(`Error: ${getApiError(error)}`));
        }
      }
    });
}
