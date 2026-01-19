// simple node script to check div nesting and report lines with col-md-10 / col-md-2 occurrences
const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../views/Dashboard/dashboard1.ejs");
const content = fs.readFileSync(file, "utf8").split("\n");
let stack = [];
content.forEach((line, idx) => {
  const lnum = idx + 1;
  if (line.includes("<div") && line.match(/col-md-(10|2)/)) {
    const m = line.match(/col-md-(10|2)/);
    stack.push({ type: m[0], line: lnum });
    console.log(`OPEN ${m[0]} at line ${lnum}`);
  }
  if (line.includes("</div>") && stack.length) {
    const last = stack.pop();
    console.log(`CLOSE ${last.type} opened@${last.line} closed@${lnum}`);
  }
});
console.log("Done");
