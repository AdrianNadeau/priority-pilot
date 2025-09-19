const fs = require("fs");
const path = "c:/repos/priority-pilot/views/Dashboard/dashboard1.ejs";
const s = fs.readFileSync(path, "utf8");
const lines = s.split("\n");
let stack = [];
function getDivClass(line) {
  const m = line.match(/<div[^>]*class=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openMatches = line.match(/<div\b/gi) || [];
  const closeMatches = line.match(/<\/div>/gi) || [];
  // handle opens (may be multiple on line)
  for (let j = 0; j < openMatches.length; j++) {
    const cls = getDivClass(line);
    stack.push({ line: i + 1, text: line.trim(), cls });
    if (cls && cls.includes("col-md-10"))
      console.log("OPEN col-md-10 at", i + 1, "stack depth", stack.length);
    if (cls && cls.includes("col-md-2"))
      console.log("OPEN col-md-2 at", i + 1, "stack depth", stack.length);
  }
  // handle closes
  for (let j = 0; j < closeMatches.length; j++) {
    const popped = stack.pop();
    if (popped) {
      if (popped.cls && popped.cls.includes("col-md-10"))
        console.log(
          "CLOSE col-md-10 at",
          i + 1,
          "popped line",
          popped.line,
          "stack depth",
          stack.length,
        );
      if (popped.cls && popped.cls.includes("col-md-2"))
        console.log(
          "CLOSE col-md-2 at",
          i + 1,
          "popped line",
          popped.line,
          "stack depth",
          stack.length,
        );
    }
  }
}
console.log("END stack size", stack.length);
if (stack.length > 0) {
  console.log("Remaining stack top entries:");
  console.log(stack.slice(-5));
}
