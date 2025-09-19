const fs = require("fs");
const path = "c:/repos/priority-pilot/views/Dashboard/dashboard1.ejs";
const text = fs.readFileSync(path, "utf8");
const lines = text.split("\n");
const openTagRegex = /<div([^>]*)>/gi;
const closeTagRegex = /<\/div>/gi;

let stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let m;
  openTagRegex.lastIndex = 0;
  while ((m = openTagRegex.exec(line)) !== null) {
    const attrs = m[1];
    const clsMatch = attrs.match(/class\s*=\s*"([^"]*)"/i);
    const cls = clsMatch ? clsMatch[1] : "";
    stack.push({ line: i + 1, cls: cls, snippet: line.trim() });
  }
  closeTagRegex.lastIndex = 0;
  while ((m = closeTagRegex.exec(line)) !== null) {
    const popped = stack.pop();
    if (popped) {
      if (popped.line === 14 && popped.cls.includes("row")) {
        console.log(`ROW opened@14 closed@${i + 1}`);
      }
    }
  }
}
console.log("stack remaining", stack.length);
if (stack.length) console.log("top", stack.slice(-5));
