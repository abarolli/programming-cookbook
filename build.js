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

class ArticlesCollector {
  constructor(articlesDir) {
    this.articlesDir = articlesDir;
    this.articles = null;
  }

  collectArticles() {
    if (this.articles) return this.articles;

    this.articles = {};
    fs.readdirSync(this.articlesDir).forEach((file) => {
      let absPath = path.join(this.articlesDir, file);
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

        if (!(heading in this.articles)) this.articles[heading] = [];

        fs.readdirSync(absPath).forEach((file) => {
          let absArticleFIlePath = path.join(absPath, file);
          this.articles[heading].push(absArticleFIlePath);
        });
      }
    });

    return this.articles;
  }
}

const articlesDir = "./src/articles";
const articlesCollector = new ArticlesCollector(articlesDir);

function buildArticleSectionHtmlPreviews() {
  const articlePreviews = {};
  const articles = articlesCollector.collectArticles();

  for (let articleSection in articles) {
    for (let absPath of articles[articleSection]) {
      let mdFile = path.basename(absPath);
      let htmlName = mdFile.replace(".md", ".html");

      let article =
        "<article class='grid__item article-preview wiper--orange'>";
      article += "<a class='article-preview-link' href='./" + htmlName + "'>";
      article +=
        "<h5 class='article-preview__title'>" +
        mdFile.split("-").join(" ").replace(".md", "") +
        "</h5>";

      let markdown = fs.readFileSync(absPath, "utf-8");
      let startIndex = markdown.indexOf("<!-- start -->") + 14;
      let truncatedText =
        markdown.slice(startIndex, startIndex + 100).trim() + "...";
      article += "<p>" + truncatedText + "</p></a></article>";

      if (!(articleSection in articlePreviews))
        articlePreviews[articleSection] = [];

      articlePreviews[articleSection].push(article);
    }
  }

  return articlePreviews;
}

function writeMdFileToHtml(absPath, marked) {
  let markdown = fs.readFileSync(absPath, "utf-8");
  let htmlName = path.basename(absPath).replace(".md", ".html");

  let articleContent = fs
    .readFileSync("./src/templates/article.html", "utf-8")
    .replace("<!-- ARICLE CONTENT -->", marked.parse(markdown));

  fs.writeFileSync(path.join(outDir, htmlName), articleContent);
}

function buildHtmlArticleSections() {
  let articleSections = "";
  let articlePreviews = buildArticleSectionHtmlPreviews();
  for (let articleSection in articlePreviews) {
    let newSection = "<section class='articles-section'>";
    newSection += "<div class='articles-section__heading'>";
    newSection +=
      "<h4 class='articles-section__title'>" + articleSection + "</h4>";
    newSection += "<a href=''>View All</a>";
    newSection += "</div>";
    newSection += "<div class='grid articles-container'>";

    for (let articlePreview of articlePreviews[articleSection]) {
      newSection += articlePreview;
    }
    newSection += "</div>";
    newSection += "</section>";
    articleSections += newSection;
  }

  return articleSections;
}

let index = fs.readFileSync("./src/index.html", "utf-8");
let articleSections = buildHtmlArticleSections();
index = index.replace("<!-- ARTICLE SECTIONS -->", articleSections);

fs.writeFileSync(path.join(outDir, "index.html"), index);

// Convert the md article files over to html files.
const articles = articlesCollector.collectArticles();
const marked = initMarked();

for (let articleSection in articles) {
  for (let articleFile of articles[articleSection]) {
    writeMdFileToHtml(articleFile, marked);
  }
}

let stylesDir = "./src/styles";
fs.readdirSync(stylesDir).forEach((file) =>
  fs.copyFileSync(path.join(stylesDir, file), outDir + "/styles/" + file)
);
let imagesDir = "./src/images";
fs.readdirSync(imagesDir).forEach((file) =>
  fs.copyFileSync(path.join(imagesDir, file), outDir + "/images/" + file)
);
