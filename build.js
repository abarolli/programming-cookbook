const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const hljs = require("highlight.js");
const { log } = require("console");

marked.setOptions({
  highlight: (code, lang) => {
    return hljs.highlight(code, { language: lang || "plaintext" }).value;
  },
});

const articlesDir = "./src/articles";

let articleSections = "";
fs.readdirSync(articlesDir).forEach((file) => {
  let absPath = articlesDir + "/" + file;
  if (fs.lstatSync(absPath).isDirectory()) {
    let slashSeparatedTerms = file.split("__");
    let heading = slashSeparatedTerms
      .map((value) => {
        return value
          .split("-")
          .map((token) => token[0].toUpperCase() + token.slice(1))
          .join(" ");
      })
      .join("/");

    let newSection = "<section class='articles-section'>";
    newSection += "<h4 class='articles-section__heading'>" + heading + "</h4>";
    newSection += "<div class='grid articles-container'>";

    fs.readdirSync(absPath).forEach((mdFile) => {
      // for each article, we'll create the structure below:
      // <article class="grid__item article-preview">
      //   <h5>Article name</h5>
      //   <p>A truncated version of the article text...</p>
      // </article>
      let article = "<article class='grid__item article-preview'>";
      article += "<h5>" + mdFile.split("-").join(" ") + "</h5>";

      let markdown = fs.readFileSync(absPath + "/" + mdFile, "utf-8");
      let startIndex = markdown.indexOf("<!-- start -->") + 14;
      let truncatedText =
        markdown.slice(startIndex, startIndex + 100).trim() + "...";
      article += "<p>" + truncatedText + "</p></article>";
      newSection += article;
    });
    newSection += "</div>";
    newSection += "</section>";
    articleSections += newSection;
  }
});

let index = fs.readFileSync("./src/index.html", "utf-8");
index = index.replace("<!-- ARTICLE SECTIONS -->", articleSections);

const outDir = "./dist";
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
  fs.mkdirSync(outDir + "/styles");
  fs.mkdirSync(outDir + "/images");
}
fs.writeFileSync(outDir + "/" + "index.html", index);

let stylesDir = "./src/styles";
fs.readdirSync(stylesDir).forEach((file) =>
  fs.copyFileSync(stylesDir + "/" + file, outDir + "/styles/" + file)
);
let imagesDir = "./src/images";
fs.readdirSync(imagesDir).forEach((file) =>
  fs.copyFileSync(imagesDir + "/" + file, outDir + "/images/" + file)
);
