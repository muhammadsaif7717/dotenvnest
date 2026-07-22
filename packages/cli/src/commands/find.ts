import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function findCommand(program: Command) {
  program
    .command("find [query]")
    .description("Find projects and view sharing status")
    .action(async (query) => {
      const config = readConfig();
      if (!config.token) {
        console.log(
          chalk.red("You are not logged in. Please run ") +
            chalk.cyan("dotenvnest login") +
            chalk.red(" first.")
        );
        return;
      }

      const spinner = ora("Searching projects...").start();

      try {
        const res = await api.get("/find", { params: { query } });
        spinner.stop();

        const { ownedProjects, sharedProjects } = res.data;

        if (ownedProjects.length === 0 && sharedProjects.length === 0) {
          console.log(
            chalk.yellow(
              query
                ? `No projects found matching "${query}".`
                : "You don't have any projects yet."
            )
          );
          return;
        }

        if (ownedProjects.length > 0) {
          console.log(chalk.bold.hex("#10b981")("\n📂 Your Projects:"));
          ownedProjects.forEach((p: any) => {
            const shareText =
              p.sharedWith.length > 0
                ? chalk.gray(` (Shared with: ${p.sharedWith.join(", ")})`)
                : "";
            console.log(`  - ${chalk.bold(p.name)}${shareText}`);
          });
        }

        if (sharedProjects.length > 0) {
          console.log(chalk.bold.hex("#3b82f6")("\n🤝 Shared With You:"));
          sharedProjects.forEach((p: any) => {
            console.log(
              `  - ${chalk.bold(p.name)} ` +
                chalk.gray(`(Shared by: ${p.owner})`)
            );
          });
        }

        console.log(""); // Empty line at the end
      } catch (error: any) {
        spinner.fail(chalk.red("Failed to find projects."));
        console.log(chalk.red(`Error: ${getApiError(error)}`));
      }
    });
}
