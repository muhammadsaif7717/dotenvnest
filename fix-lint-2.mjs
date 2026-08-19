import fs from "fs";
import path from "path";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (
      stat &&
      stat.isDirectory() &&
      !file.includes("node_modules") &&
      !file.includes(".next") &&
      !file.includes("dist")
    ) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(".");

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  // Fix error: any
  if (content.includes("error: any")) {
    content = content.replace(/error: any/g, "error: unknown");
    changed = true;
  }
  // Fix err: any
  if (content.includes("err: any")) {
    content = content.replace(/err: any/g, "err: unknown");
    changed = true;
  }
  // Fix e: any
  if (content.includes("e: any")) {
    content = content.replace(/e: any/g, "e: unknown");
    changed = true;
  }
  // Fix require
  if (content.includes("require('os')")) {
    content = content.replace(
      /const os = require\('os'\);/g,
      "import os from 'os';"
    );
    changed = true;
  }
  if (content.includes("require('crypto')")) {
    content = content.replace(
      /const crypto = require\('crypto'\);/g,
      "import crypto from 'crypto';"
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, "utf8");
  }
});
