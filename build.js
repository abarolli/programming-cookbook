const fs = require("fs");
const path = require("path");
const { Marked } = require("marked");
const { markedHighlight } = require("marked-highlight");
const hljs = require("highlight.js");
const { log } = require("console");

function initMarked() {
  const marked = new Marked(
    markedHighlight({
      emptyLangClass: "hljs",
      langPrefix: "hljs language-",
      highlight(code, lang, info) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    })
  );

  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const id = text.toLowerCase().replace(/[^\w]+/g, "-");

    return `
  <h${depth} id=${id}>
  
  ${text}
  </h${depth}>`;
  };

  marked.use({ renderer });
  return marked;
}

function createOutDir(outDir) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
    fs.mkdirSync(outDir + "/styles");
    fs.mkdirSync(outDir + "/images");
  }
}

const outDir = "./dist";
createOutDir(outDir);

const articlesDir = "./src/articles";

function collectArticles() {
  const articles = {};
  fs.readdirSync(articlesDir).forEach((file) => {
    let absPath = path.join(articlesDir, file);
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

      if (!(heading in articles)) articles[heading] = [];

      fs.readdirSync(absPath).forEach((file) => {
        let absArticleFIlePath = path.join(absPath, file);
        articles[heading].push(absArticleFIlePath);
      });
    }
  });

  return articles;
}

function buildArticleSectionsHtml() {
  const marked = initMarked();

  let articleSections = "";
  let articles = collectArticles();
  for (let articleSection in articles) {
    let newSection = "<section class='articles-section'>";
    newSection +=
      "<h4 class='articles-section__heading'>" + articleSection + "</h4>";
    newSection += "<div class='grid articles-container'>";

    for (let absPath of articles[articleSection]) {
      // for each article, we'll create the structure below:
      // <article class="grid__item article-preview">
      //   <h5>Article name</h5>
      //   <p>A truncated version of the article text...</p>
      // </article>
      let mdFile = path.basename(absPath);
      let htmlName = mdFile.replace(".md", ".html");

      let article =
        "<article class='grid__item article-preview wiper--orange'>";
      article += "<a class='article-preview-link' href='./" + htmlName + "'>";
      article +=
        "<h5>" + mdFile.split("-").join(" ").replace(".md", "") + "</h5>";

      let markdown = fs.readFileSync(absPath, "utf-8");

      let articleContent = fs
        .readFileSync("./src/templates/article.html", "utf-8")
        .replace("<!-- ARICLE CONTENT -->", marked.parse(markdown));

      fs.writeFileSync(path.join(outDir, htmlName), articleContent);

      let startIndex = markdown.indexOf("<!-- start -->") + 14;
      let truncatedText =
        markdown.slice(startIndex, startIndex + 100).trim() + "...";
      article += "<p>" + truncatedText + "</p></a></article>";
      newSection += article;
    }
    newSection += "</div>";
    newSection += "</section>";
    articleSections += newSection;
  }

  return articleSections;
}

let index = fs.readFileSync("./src/index.html", "utf-8");
let articleSections = buildArticleSectionsHtml();
index = index.replace("<!-- ARTICLE SECTIONS -->", articleSections);

fs.writeFileSync(path.join(outDir, "index.html"), index);

let stylesDir = "./src/styles";
fs.readdirSync(stylesDir).forEach((file) =>
  fs.copyFileSync(path.join(stylesDir, file), outDir + "/styles/" + file)
);
let imagesDir = "./src/images";
fs.readdirSync(imagesDir).forEach((file) =>
  fs.copyFileSync(path.join(imagesDir, file), outDir + "/images/" + file)
);
