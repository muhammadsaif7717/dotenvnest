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

      const normalizedProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

      const spinner = ora(`Removing access for ${email} from ${chalk.bold(normalizedProjectName)}...`).start();

      try {
        const res = await api.post("/unshare", {
          projectName: normalizedProjectName,
          email
        });
        
        spinner.succeed(chalk.green(res.data.message));
      } catch (error: any) {
        spinner.fail(chalk.red("Failed to unshare project."));
        console.log(chalk.red(`Error: ${getApiError(error)}`));
      }
    });
}
