import React from "react";
import { Terminal, Download, LogIn, Upload, CloudDownload, Search, Share2, UserMinus } from "lucide-react";

export const metadata = {
  title: "CLI Documentation - Dotenvnest",
  description: "Learn how to use the Dotenvnest CLI to manage your environment variables seamlessly.",
};

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-xl overflow-x-auto border border-zinc-800 my-4 text-sm font-mono shadow-inner">
      <code>{children}</code>
    </pre>
  );
}

function CommandDoc({
  command,
  description,
  icon: Icon,
  example,
  options
}: {
  command: string;
  description: string;
  icon: React.ElementType;
  example: string;
  options?: { name: string; desc: string }[];
}) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-zinc-900/50 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
          dotenvnest {command}
        </h3>
      </div>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">{description}</p>
      
      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">Example</h4>
        <CodeBlock>{example}</CodeBlock>
      </div>

      {options && options.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">Options</h4>
          <ul className="space-y-2">
            {options.map((opt, i) => (
              <li key={i} className="text-sm flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-300 shrink-0">{opt.name}</span>
                <span className="text-zinc-600 dark:text-zinc-500">{opt.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-300 selection:bg-emerald-500/30 flex justify-center p-6 md:p-12 lg:p-16">
      <main className="w-full max-w-4xl">
          
          <div className="mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-6 shadow-sm border border-emerald-200 dark:border-emerald-500/30">
              <Terminal className="w-8 h-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">
              CLI Documentation
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
              The Dotenvnest Command Line Interface (CLI) allows you to securely synchronize your <code className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">.env</code> files between your local development environment and the cloud.
            </p>
          </div>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Download className="w-6 h-6 text-emerald-500" />
              Installation
            </h2>
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                You can install the CLI globally using npm:
              </p>
              <CodeBlock>npm install -g dotenvnest</CodeBlock>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
              Command Reference
            </h2>

            <CommandDoc
              command="login"
              description="Authenticates the CLI securely via your browser. If you are already logged in to the web application, it authenticates automatically."
              icon={LogIn}
              example="dotenvnest login"
            />

            <CommandDoc
              command="push <project-name>"
              description="Encrypts and uploads your local .env file to the specified project on Dotenvnest."
              icon={Upload}
              example="dotenvnest push my-api-server"
              options={[
                { name: "-f, --file <filename>", desc: "Specify a different file to push (default: .env)" },
                { name: "--owner <email>", desc: "Specify the owner email if pushing to a project shared with you" }
              ]}
            />

            <CommandDoc
              command="pull <project-name>"
              description="Downloads and decrypts the .env file from the specified project on Dotenvnest."
              icon={CloudDownload}
              example="dotenvnest pull my-api-server"
              options={[
                { name: "-f, --file <filename>", desc: "Specify a different file to output to (default: .env)" },
                { name: "--owner <email>", desc: "Specify the owner email if pulling from a project shared with you" }
              ]}
            />

            <CommandDoc
              command="find [query]"
              description="Searches for projects in your account and projects shared with you. If no query is provided, it lists all of your projects."
              icon={Search}
              example="dotenvnest find api"
            />

            <CommandDoc
              command="share <project-name> <emails>"
              description="Shares a project with one or more users (comma-separated). The users must have a Dotenvnest account."
              icon={Share2}
              example='dotenvnest share my-api-server "user1@example.com, user2@example.com" --access edit'
              options={[
                { name: "--access <level>", desc: "Access level: 'read' or 'edit' (default: read)" }
              ]}
            />

            <CommandDoc
              command="unshare <project-name> <emails>"
              description="Revokes access to a shared project from one or more users (comma-separated)."
              icon={UserMinus}
              example='dotenvnest unshare my-api-server "user1@example.com, user2@example.com"'
            />

            <CommandDoc
              command="logout"
              description="Logs you out of the CLI and clears your local authentication token."
              icon={LogIn}
              example="dotenvnest logout"
            />
          </section>

          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center pb-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Need help? Feel free to reach out to our support team or check our GitHub repository.
            </p>
          </div>
      </main>
    </div>
  );
}
