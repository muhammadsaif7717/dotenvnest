import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import inquirer from "inquirer";
import Fuse from "fuse.js";
import ora from "ora";
import path from "path";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function pullCommand(program: Command) {
  program
    .command("pull <project-name>")
    .description("Pull .env file from Dotenvnest")
    .option(
      "-f, --file <filename>",
      "Specify a different file to output to (e.g., .env.local)",
      ".env"
    )
    .option(
      "--owner <email>",
      "Specify the owner email if pulling from a shared project"
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
          },
        ]);

        if (!overwrite) {
          console.log(chalk.yellow("Pull cancelled."));
          return;
        }
      }

      const spinner = ora(
        `Pulling project ${chalk.bold(finalProjectName)}...`
      ).start();

      try {
        const findRes = await api.get("/find");
        const { ownedProjects, sharedProjects } = findRes.data;
        const allProjects = [...ownedProjects, ...sharedProjects];

        // 1. Exact or case-insensitive match
        const exactMatch = allProjects.find(
          (p: any) => p.name.toLowerCase() === finalProjectName.toLowerCase()
        );

        if (exactMatch) {
          finalProjectName = exactMatch.name;
        } else {
          // 2. Fuzzy search
          const fuse = new Fuse(allProjects, {
            keys: ["name"],
            threshold: 0.4,
          });
          const results = fuse.search(finalProjectName);

          if (results.length > 0) {
            spinner.stop();
            const topMatch = results[0].item.name;
            const { confirmFuzzy } = await inquirer.prompt([
              {
                type: "confirm",
                name: "confirmFuzzy",
                message: `Project '${finalProjectName}' not found. Did you mean '${chalk.cyan(topMatch)}'?`,
                default: true,
              },
            ]);

            if (confirmFuzzy) {
              finalProjectName = topMatch;
              spinner.start(
                `Pulling project ${chalk.bold(finalProjectName)}...`
              );
            } else {
              console.log(chalk.yellow("Pull cancelled."));
              return;
            }
          }
        }

        const res = await api.get("/pull", {
          params: {
            projectName: finalProjectName,
            ownerEmail: options.owner,
          },
        });

        fs.writeFileSync(envPath, res.data.envContent);

        spinner.succeed(
          chalk.green(`Successfully pulled into ${options.file}!`)
        );
      } catch (error: any) {
        spinner.fail(chalk.red("Pull failed."));
        const message = getApiError(error);
        console.log(chalk.red(`Error: ${message}`));
      }
    });
}
