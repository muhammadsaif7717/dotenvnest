import React from "react";
import { Terminal, Download, LogIn, Upload, CloudDownload, Search, Share2, UserMinus, Settings } from "lucide-react";

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
              description="Encrypts and uploads your local .env file. Pushing a variant like .env.local automatically creates a new project variant (e.g. project-name.local). Smartly detects shared projects automatically."
              icon={Upload}
              example="dotenvnest push my-api-server"
              options={[
                { name: "-f, --file <filename>", desc: "Specify a different file to push (default: .env)" },
                { name: "--owner <email>", desc: "Specify the owner email (only required if there is a name collision)" }
              ]}
            />

            <CommandDoc
              command="pull <project-name>"
              description="Downloads and decrypts the .env file from the specified project. Smartly detects shared projects automatically."
              icon={CloudDownload}
              example="dotenvnest pull my-api-server"
              options={[
                { name: "-f, --file <filename>", desc: "Specify a different file to output to (default: .env)" },
                { name: "--owner <email>", desc: "Specify the owner email (only required if there is a name collision)" }
              ]}
            />

            <CommandDoc
              command="find [query]"
              description="Searches for projects in your account and projects shared with you, displaying the owner's email for shared projects."
              icon={Search}
              example="dotenvnest find api"
            />

            <CommandDoc
              command="view <project-name>"
              description="Securely prints the environment variables of a project in your terminal without saving a local file."
              icon={Search}
              example="dotenvnest view my-api-server"
              options={[
                { name: "--owner <email>", desc: "Specify the owner email (if needed for shared projects)" }
              ]}
            />

            <CommandDoc
              command="diff <project-name>"
              description="Compares your local .env file with the one saved in the cloud, highlighting added, removed, or changed variables."
              icon={Search}
              example="dotenvnest diff my-api-server"
              options={[
                { name: "-f, --file <filename>", desc: "Specify a different local file to compare (default: .env)" },
                { name: "--owner <email>", desc: "Specify the owner email (if needed for shared projects)" }
              ]}
            />

            <CommandDoc
              command="del <project-name>"
              description="Permanently deletes a project that you own. Shared projects cannot be deleted."
              icon={UserMinus}
              example="dotenvnest del my-api-server"
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
              command="leave <project-name>"
              description="Leaves a project that someone else has shared with you, removing your access."
              icon={UserMinus}
              example="dotenvnest leave my-api-server"
            />

            <CommandDoc
              command="logout"
              description="Logs you out of the CLI and clears your local authentication token."
              icon={LogIn}
              example="dotenvnest logout"
            />
          </section>

          {/* CI/CD Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-emerald-500" />
              CI/CD & Automation
            </h2>
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                You can easily integrate <strong>DotEnvNest</strong> into your automated pipelines (like GitHub Actions, GitLab CI, or Vercel) without needing an interactive browser login.
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Simply set the <code className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">DOTENVNEST_TOKEN</code> environment variable in your pipeline settings. The CLI will automatically use it for authentication.
              </p>
              <CodeBlock>
{`# Example in a CI script
export DOTENVNEST_TOKEN="your_cli_token_here"
npx dotenvnest pull my-api-server`}
              </CodeBlock>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4 italic">
                * Tip: You can find your personal CLI token inside the ~/.dotenvnest-config.json file on your computer after logging in locally.
              </p>
            </div>
          </section>

          {/* Advanced Usage Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Terminal className="w-6 h-6 text-emerald-500" />
              Advanced Usage & Tips
            </h2>
            
            <div className="space-y-6">
              {/* Variants */}
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  1. Understanding File Variants (-f / --file)
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  By default, the CLI looks for a file named <code className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">.env</code>. But what if you have <code className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">.env.local</code> or <code className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">.env.production</code>? 
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  If you use the <strong>-f</strong> flag to push a variant, the CLI automatically maps it to a new project name in the cloud!
                </p>
                <CodeBlock>
{`# Pushes to project "my-api"
dotenvnest push my-api

# Pushes to a new project named "my-api.local"
dotenvnest push my-api -f .env.local

# Pushes to a new project named "my-api.production"
dotenvnest push my-api -f .env.production`}
                </CodeBlock>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4 italic">
                  * Tip: When you run <code>dotenvnest find</code>, you will clearly see all your variants listed as separate projects, keeping everything perfectly organized.
                </p>
              </div>

              {/* Owner Collision */}
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  2. Handling Name Collisions (--owner)
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  Imagine you have a project named <code className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">backend</code>. Your friend also shares their project named <code className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">backend</code> with you.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  If you run <code>dotenvnest pull backend</code>, the CLI gets confused: "Which backend do you want?" It will throw an error asking you to specify the owner. You can fix this by using the <strong>--owner</strong> flag.
                </p>
                <CodeBlock>
{`# Pulls YOUR backend project
dotenvnest pull backend

# Pulls your FRIEND'S backend project
dotenvnest pull backend --owner friend@email.com`}
                </CodeBlock>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4 italic">
                  * Note: The <code>--owner</code> flag works perfectly with <code>push</code>, <code>pull</code>, <code>view</code>, and <code>diff</code>.
                </p>
              </div>

              {/* Spaces in Names */}
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  3. Project Names with Spaces
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  If your project name contains spaces (e.g. <code className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">Developer Saif</code>), you must wrap the name in double quotes when running CLI commands. 
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  Otherwise, the terminal will treat the second word as an invalid argument and throw a <strong>"too many arguments"</strong> error.
                </p>
                <CodeBlock>
{`# ❌ This will throw an error
dotenvnest pull Developer Saif

# ✅ This will work perfectly
dotenvnest pull "Developer Saif"`}
                </CodeBlock>
              </div>
            </div>
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
