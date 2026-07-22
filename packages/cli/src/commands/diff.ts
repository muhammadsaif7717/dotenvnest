import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { api, getApiError } from "../utils/api";
import { readConfig } from "../utils/config";

export function diffCommand(program: Command) {
  program
    .command("diff <project-name>")
    .description("Compare your local .env file with the one saved in the cloud")
    .option(
      "-f, --file <filename>",
      "Specify a different local file to compare (default: .env)"
    )
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

      let finalProjectName = projectName.trim();
      const localFileName = options.file || ".env";

      // If pushing/pulling variants, we mapped them. Let's do the same for diff if it's a variant.
      if (options.file && options.file.startsWith(".env.")) {
        const suffix = options.file.substring(5);
        if (suffix) {
          finalProjectName = `${finalProjectName}.${suffix}`;
        }
      }

      const envPath = path.resolve(process.cwd(), localFileName);

      let localEnvConfig: Record<string, string> = {};

      if (fs.existsSync(envPath)) {
        const localFileContent = fs.readFileSync(envPath, "utf-8");
        localEnvConfig = dotenv.parse(localFileContent);
      } else {
        console.log(
          chalk.yellow(
            `Local file ${localFileName} not found. Assuming local is empty.`
          )
        );
      }

      const spinner = ora(
        `Fetching cloud variables for ${chalk.bold(finalProjectName)}...`
      ).start();

      try {
        const response = await api.get("/pull", {
          params: {
            projectName: finalProjectName,
            ...(options.owner && { ownerEmail: options.owner }),
          },
        });

        spinner.stop();

        const cloudEnvContent = response.data.envContent;
        const cloudEnvConfig = cloudEnvContent
          ? dotenv.parse(cloudEnvContent)
          : {};

        const localKeys = Object.keys(localEnvConfig);
        const cloudKeys = Object.keys(cloudEnvConfig);
        const allKeys = Array.from(
          new Set([...localKeys, ...cloudKeys])
        ).sort();

        console.log(
          chalk.bold(
            `\nDiff between cloud (${finalProjectName}) and local (${localFileName}):\n`
          )
        );

        let hasDifferences = false;

        for (const key of allKeys) {
          const inLocal = key in localEnvConfig;
          const inCloud = key in cloudEnvConfig;

          if (inLocal && !inCloud) {
            console.log(
              chalk.green(`+ Added locally:   ${key} = ${localEnvConfig[key]}`)
            );
            hasDifferences = true;
          } else if (!inLocal && inCloud) {
            console.log(
              chalk.red(`- Removed locally: ${key} = ${cloudEnvConfig[key]}`)
            );
            hasDifferences = true;
          } else if (inLocal && inCloud) {
            if (localEnvConfig[key] !== cloudEnvConfig[key]) {
              console.log(chalk.yellow(`~ Changed locally: ${key}`));
              console.log(chalk.gray(`  - Cloud: ${cloudEnvConfig[key]}`));
              console.log(chalk.gray(`  + Local: ${localEnvConfig[key]}`));
              hasDifferences = true;
            }
          }
        }

        if (!hasDifferences) {
          console.log(
            chalk.green("✔ No differences found. Both files are identical.")
          );
        }

        console.log(""); // Empty line for padding
      } catch (error: any) {
        spinner.fail(chalk.red("Failed to compare project."));
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
