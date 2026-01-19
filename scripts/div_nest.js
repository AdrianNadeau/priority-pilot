const fs = require("fs");
const path = "c:/repos/priority-pilot/views/Dashboard/dashboard1.ejs";
const lines = fs.readFileSync(path, "utf8").split("\n");
let level = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const divOpenRegex = /<div([^>]*)>/gi;
  const divCloseRegex = /<\/div>/gi;
  let m;
  while ((m = divOpenRegex.exec(l)) !== null) {
    level++;
    const attrs = m[1] || "";
    const clsMatch = attrs.match(/class\s*=\s*"([^"]*)"/i);
    const cls = clsMatch ? clsMatch[1] : "";
    console.log(
      `${(i + 1).toString().padStart(4)} + open lvl=${level} class="${cls}" | ${l.trim()}`,
    );
  }
  while ((m = divCloseRegex.exec(l)) !== null) {
    const cls = ""; // closing tag has no class
    console.log(
      `${(i + 1).toString().padStart(4)} - close lvl=${level} | ${l.trim()}`,
    );
    level--;
  }
}
console.log("final level", level);
