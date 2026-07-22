import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function pullCommand(program: Command) {
  program
    .command("pull <project-name>")
    .description("Pull .env file from Dotenvnest")
    .option("-f, --file <filename>", "Specify a different file to output to (e.g., .env.local)", ".env")
    .option("--owner <email>", "Specify the owner email if pulling from a shared project")
    .action(async (projectName, options) => {
      const config = readConfig();
      if (!config.token) {
        console.log(chalk.red("You are not logged in. Please run ") + chalk.cyan("dotenvnest login") + chalk.red(" first."));
        return;
      }

      let finalProjectName = projectName.trim();
      if (options.file && options.file.startsWith(".env.")) {
        const suffix = options.file.substring(5);
        if (suffix) {
          finalProjectName = `${finalProjectName}.${suffix}`;
        }
      }
      const envPath = path.resolve(process.cwd(), options.file);
      
      // Warn about overwrite
      if (fs.existsSync(envPath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: "confirm",
            name: "overwrite",
            message: `File ${chalk.cyan(options.file)} already exists. Do you want to overwrite it?`,
            default: false,
          }
        ]);
        
        if (!overwrite) {
          console.log(chalk.yellow("Pull cancelled."));
          return;
        }
      }

      const spinner = ora(`Pulling project ${chalk.bold(finalProjectName)}...`).start();

      try {
        const res = await api.get("/pull", {
          params: {
            projectName: finalProjectName,
            ownerEmail: options.owner
          }
        });
        
        fs.writeFileSync(envPath, res.data.envContent);
        
        spinner.succeed(chalk.green(`Successfully pulled into ${options.file}!`));
      } catch (error: any) {
        spinner.fail(chalk.red("Pull failed."));
        const message = getApiError(error);
        console.log(chalk.red(`Error: ${message}`));
      }
    });
}
