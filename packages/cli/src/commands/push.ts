import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function pushCommand(program: Command) {
  program
    .command("push <project-name>")
    .description("Push local .env file to Dotenvnest")
    .option("-f, --file <filename>", "Specify a different file to push (e.g., .env.local)", ".env")
    .option("--owner <email>", "Specify the owner email if pushing to a shared project")
    .action(async (projectName, options) => {
      const config = readConfig();
      if (!config.token) {
        console.log(chalk.red("You are not logged in. Please run ") + chalk.cyan("dotenvnest login") + chalk.red(" first."));
        return;
      }

      const finalProjectName = projectName.trim();

      const envPath = path.resolve(process.cwd(), options.file);
      
      if (!fs.existsSync(envPath)) {
        console.log(chalk.red(`File not found: ${options.file}`));
        console.log(chalk.yellow(`Ensure you are in the correct directory, or use -f <filename> to specify the file.`));
        return;
      }

      const stats = fs.statSync(envPath);
      if (stats.size > 2 * 1024 * 1024) { // 2MB
        console.log(chalk.red("File is too large. Maximum size is 2MB."));
        return;
      }

      const envContent = fs.readFileSync(envPath, "utf8");

      // Basic validation
      if (!envContent.includes("=") && envContent.trim().length > 0) {
         // It might be a valid file with just comments, but let's be lenient.
         // Most valid .env files will have an '='. If not, we still let it pass,
         // but maybe just warn the user.
         const lines = envContent.split("\n").filter(l => l.trim().length > 0 && !l.trim().startsWith("#"));
         if (lines.length > 0 && !lines.some(l => l.includes("="))) {
            console.log(chalk.yellow("Warning: The file doesn't seem to contain any valid KEY=VALUE pairs. Proceeding anyway..."));
         }
      }

      const spinner = ora(`Pushing ${chalk.cyan(options.file)} to project ${chalk.bold(finalProjectName)}...`).start();

      try {
        await api.post("/push", {
          projectName: finalProjectName,
          envContent,
          ownerEmail: options.owner
        });
        
        spinner.succeed(chalk.green(`Successfully pushed to ${finalProjectName}!`));
      } catch (error: any) {
        spinner.fail(chalk.red("Push failed."));
        const message = getApiError(error);
        console.log(chalk.red(`Error: ${message}`));
        if (error.response?.status === 401) {
          console.log(chalk.yellow("Your session might be expired. Try running 'dotenvnest login' again."));
        } else if (error.response?.status === 403 && message.includes("PIN")) {
           console.log(chalk.yellow("Please visit https://dotenvnest.vercel.app and complete your encryption PIN setup."));
        }
      }
    });
}
