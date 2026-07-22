import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function unshareCommand(program: Command) {
  program
    .command("unshare <project-name> <email>")
    .description("Remove access to a shared project")
    .action(async (projectName, email) => {
      const config = readConfig();
      if (!config.token) {
        console.log(chalk.red("You are not logged in. Please run ") + chalk.cyan("dotenvnest login") + chalk.red(" first."));
        return;
      }

      const finalProjectName = projectName.trim();

      const emails = email.split(",").map((e: string) => e.trim()).filter((e: string) => e.length > 0);

      for (const e of emails) {
        const spinner = ora(`Revoking access to project ${chalk.bold(finalProjectName)} for ${chalk.cyan(e)}...`).start();

        try {
          const res = await api.post("/unshare", {
            projectName: finalProjectName,
            email: e
          });
          
          spinner.succeed(chalk.green(`Successfully revoked access to ${finalProjectName} for ${e}!`));
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to unshare project with ${e}.`));
          console.log(chalk.red(`Error: ${getApiError(error)}`));
        }
      }
    });
}
