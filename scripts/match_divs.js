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
  // process all opening tags in line
  openTagRegex.lastIndex = 0;
  while ((m = openTagRegex.exec(line)) !== null) {
    const attrs = m[1];
    const clsMatch = attrs.match(/class\s*=\s*"([^"]*)"/i);
    const cls = clsMatch ? clsMatch[1] : "";
    stack.push({ line: i + 1, cls: cls, snippet: line.trim() });
    if (cls.includes("col-md-10")) {
      console.log(`FOUND OPEN col-md-10 at line ${i + 1}`);
    }
    if (cls.includes("col-md-2")) {
      console.log(`FOUND OPEN col-md-2 at line ${i + 1}`);
    }
  }
  // process closing tags in line
  closeTagRegex.lastIndex = 0;
  while ((m = closeTagRegex.exec(line)) !== null) {
    const popped = stack.pop();
    if (!popped) {
      console.log(`Unmatched close at line ${i + 1}`);
    } else {
      if (popped.cls && popped.cls.includes("col-md-10")) {
        console.log(`MATCHED col-md-10 open@${popped.line} closed@${i + 1}`);
      }
      if (popped.cls && popped.cls.includes("col-md-2")) {
        console.log(`MATCHED col-md-2 open@${popped.line} closed@${i + 1}`);
      }
    }
  }
}
console.log("stack remaining:", stack.length);
if (stack.length > 0) {
  console.log("top of stack:", stack.slice(-5));
}
