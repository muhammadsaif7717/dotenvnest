<div align="center">
  <img src="./public/icon.png" alt="DotEnvNest Logo" width="120" />
  <h1>DotEnvNest</h1>
  <p><strong>A Secure, Beautiful, and Open-Source Platform to Manage Your .env Files</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
</div>

<br />

DotEnvNest is a specialized developer tool created to securely store, manage, and retrieve project `.env` files. Never lose your environment variables again or accidentally expose them in plain text!

## ✨ Features

- **🔒 Secure Storage**: User PIN encryption protects your environment secrets in the database.
- **💻 Built-in IDE Experience**: Edit `.env` files with a VSCode-like editor complete with line numbers and syntax highlighting.
- **🎨 Stunning UI/UX**: Built with Next.js, TailwindCSS, and shadcn/ui. Fully supports Dark and Light modes.
- **🔍 Global Search**: Instantly find environment configurations across all your projects.
- **📋 Copy & Download**: Quickly copy your entire `.env` file to the clipboard or download it directly as a file.
- **🚀 PWA Support**: Install it on your device and use it like a native application!

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: JWT & Custom PIN encryption
- **State Management**: [React Query](https://tanstack.com/query/latest)

## 🚀 Getting Started

Want to run your own instance of DotEnvNest? Follow these steps!

### Prerequisites
- Node.js 18+ installed.
- A MongoDB connection URI.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/muhammadsaif7717/dotenvnest.git
   cd dotenvnest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root of the project with the following:
   ```env
   # Your MongoDB Connection String
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dotenvnest
   
   # Secret for JWT signing
   JWT_SECRET=super_secret_jwt_key
   
   # Secret for global encryption (Must be a 32-character string)
   GLOBAL_SECRET=your_32_character_global_secret_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/muhammadsaif7717/dotenvnest/issues).

## 📝 License

This project is [MIT](./LICENSE) licensed.

---
*Created by [MD. SAIF ISLAM](https://github.com/muhammadsaif7717)*
