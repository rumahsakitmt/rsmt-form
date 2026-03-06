const PizZip = require("pizzip");
const fs = require("fs");
const content = fs.readFileSync(process.argv[2], "binary");
const zip = new PizZip(content);
let text = "";
const files = zip.file(/.*/);
files.forEach(f => {
    if (f.name.startsWith("word/") && f.name.endsWith(".xml")) {
        const plainText = f.asText().replace(/<[^>]+>/g, "").replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");
        text += plainText + " ";
    }
});
console.log(text.substring(0, 500));
const idx = text.indexOf("education");
console.log(text.substring(Math.max(0, idx - 20), idx + 100));
