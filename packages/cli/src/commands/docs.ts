import { Command } from "commander";
import chalk from "chalk";
import open from "open";

export function docsCommand(program: Command) {
  program
    .command("docs")
    .description("Open the Dotenvnest documentation in your browser")
    .action(async () => {
      const docsUrl = "https://dotenvnest.vercel.app/docs";
      console.log(chalk.gray(`Opening documentation at ${docsUrl}...`));

      try {
        await open(docsUrl);
      } catch (err) {
        console.log(
          chalk.red(`Failed to open browser. Please visit manually: ${docsUrl}`)
        );
      }
    });
}
