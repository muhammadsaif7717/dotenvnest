import { Command } from "commander";
import http from "http";
import url from "url";
import open from "open";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import { saveConfig, readConfig } from "../utils/config";
import { api, getApiError } from "../utils/api";

export function loginCommand(program: Command) {
  program
    .command("login")
    .description("Log in to Dotenvnest")
    .action(async () => {
      const config = readConfig();
      if (config.token) {
        // Verify token still valid
        const spinner = ora("Verifying existing session...").start();
        try {
          // Just a ping to see if token works, using /find as a ping
          await api.get("/find");
          spinner.succeed("Already logged in.");
          return;
        } catch (error) {
          spinner.info("Session expired. Logging in again...");
        }
      }

      console.log(chalk.bold("\n🚀 Authenticating with Dotenvnest\n"));

      const server = http.createServer();
      
      server.on("request", (req, res) => {
        if (!req.url) return;
        const reqUrl = url.parse(req.url, true);

        if (reqUrl.pathname === "/") {
          const token = reqUrl.query.token as string;
          if (token) {
            saveConfig({ token });
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff;">
                  <div style="text-align: center;">
                    <h1 style="color: #10b981;">Authentication Successful</h1>
                    <p>You can close this tab and return to your terminal.</p>
                  </div>
                </body>
              </html>
            `);
            
            console.log(
              boxen(chalk.hex('#10b981').bold("Successfully logged in!"), {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "green",
              })
            );
            
            server.close();
            process.exit(0);
          } else {
            res.writeHead(400);
            res.end("Invalid request.");
          }
        }
      });

      server.listen(0, async () => {
        const address = server.address();
        const port = typeof address === "string" ? 0 : address?.port;
        
        const loginUrl = `https://dotenvnest.vercel.app/login?cli_port=${port}`;
        
        console.log(chalk.gray(`Opening browser to: ${loginUrl}`));
        
        const spinner = ora("Waiting for authentication...").start();
        
        try {
          await open(loginUrl);
        } catch (err) {
          spinner.fail(`Failed to open browser. Please open the link manually: ${chalk.cyan(loginUrl)}`);
        }

        // Timeout after 5 minutes
        setTimeout(() => {
          spinner.fail("Authentication timed out.");
          server.close();
          process.exit(1);
        }, 5 * 60 * 1000);
      });
    });
}
