// treemap.ts
import { readFileSync, writeFileSync } from "fs";
import * as path from "path";

function filter(data: any) {
  let files = [];
  for (const prop in data) {
    const item = data[prop];
    if (item.path) {
      const filename = path.basename(item.path.replace(/\\/g, "/"));
      let stmtCount = 0;
      let coveredStmtCount = 0;
      for (const entry in item.s) {
        stmtCount++;
        if (item.s[entry] > 0) coveredStmtCount++;
      }

      const coverage = coveredStmtCount / stmtCount;
      files.push({
        filename,
        statementCount: stmtCount,
        statementCoverage: coverage,
      });
    }
  }
  return files;
  // console.log(
  //   files
  //     .map((d) => `${d.filename}: ${Math.round(d.statementCoverage * 100)}%`)
  //     .join("\n")
  // );
}

// <svg [attr.width]="width" [attr.height]="height">
// <g *ngFor="let stack of stacks">
//     <rect *ngFor="let bar of makeBars(stack.values, stack.stackIndex)" [attr.width]="bar.width" [attr.height]="bar.height" [attr.x]="bar.x"
//         [attr.y]="bar.y" [attr.rx]="bar.rx" [attr.class]="classForSeries(bar.seriesIndex)" />
// </g>
// <rect x="0" y="0" [attr.width]="width" [attr.height]="height" stroke="red" stroke-width="2" fill="transparent" />
// </svg>

function treemapSvg(
  data: {
    filename: string;
    statementCount: number;
    statementCoverage: number;
  }[]
) {
  const coverageThreshold = 0.8;

  const width = 400;
  const height = 200;
  let svgHeader = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
<style>
  rect { transition: filter 0.2s; cursor: pointer; }
  rect:hover { filter: brightness(1.2); }
</style>
<g>`;
  let svgBody = "";
  let svgFooter = "</g></svg>";

  const totalStmts = data.map((d) => d.statementCount).reduce((a, b) => a + b);
  console.log(`Found ${totalStmts} statements in ${data.length} files.`);

  let remainingHeight = height;
  let remainingWidth = width;
  let currX = 0;
  let currY = 0;
  let remainingStmts = totalStmts;
  data
    .sort((a, b) => {
      return a.statementCount > b.statementCount ? -1 : 1;
    })
    .forEach((item, i) => {
      // const vertical = i % 2;
      const horizontal = remainingHeight < remainingWidth;

      let rectWidth;
      let rectHeight;

      if (horizontal) {
        rectWidth = (remainingWidth * item.statementCount) / remainingStmts;
        rectHeight = remainingHeight;
      } else {
        rectWidth = remainingWidth;
        rectHeight = (remainingHeight * item.statementCount) / remainingStmts;
      }

      const colour =
        item.statementCoverage > coverageThreshold ? "#009e73" : "#d55e00";
      const opacity =
        item.statementCoverage > coverageThreshold
          ? 0.5
          : 1 - item.statementCoverage;
      const roundedCoverage = Math.round(item.statementCoverage * 100);
      let svgRect = `<rect x="${currX}" y="${currY}" width="${rectWidth}" height="${rectHeight}" fill="${colour}" stroke="white" stroke-width="2" rx="4" opacity="${opacity}" role="img" aria-label="${item.filename}: ${item.statementCount} statements, ${roundedCoverage}% coverage"> <title>${item.filename}:${item.statementCount} (${roundedCoverage}%)</title> </rect>`;

      svgBody += svgRect;

      if (horizontal) {
        currX += rectWidth;
        remainingWidth -= rectWidth;
      } else {
        currY += rectHeight;
        remainingHeight -= rectHeight;
      }
      remainingStmts -= item.statementCount;
    });

  return svgHeader + svgBody + svgFooter;
}

function treemapHtml(
  data: {
    filename: string;
    statementCount: number;
    statementCoverage: number;
  }[]
) {
  const width = 400;
  const height = 200;
  const svg = treemapSvg(data);

  return `<html>
<head>
  <style>
    body { font-family: sans-serif; margin: 2rem; }
    .treemap-container { max-width: 800px; margin: 0 auto; }
    svg { width: 100%; height: auto; display: block; }
    .legend { display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.9rem; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; }
    .legend-color { width: 1rem; height: 1rem; border-radius: 2px; }
  </style>
</head>
<body>
  <div class="treemap-container">
    ${svg}
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color" style="background-color: #009e73; opacity: 0.5;"></div>
        <span>High Coverage (&gt;80%)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #d55e00;"></div>
        <span>Low Coverage (&le;80%)</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// graphviz dot file output, using the "patchwork" layout
function treemapDot(
  data: {
    filename: string;
    statementCount: number;
    statementCoverage: number;
  }[]
) {
  const coverageThreshold = 0.8;
  const dotHeader = "graph {\n    layout=patchwork\n    node [style=filled]";
  let dotBody = "\n";
  const dotFooter = "\n}";

  data.forEach((item) => {
    const colour =
      item.statementCoverage > coverageThreshold ? "#009e73" : "#d55e00";
    const roundedCoverage = Math.round(item.statementCoverage * 100);
    const label = `${item.filename}\n(${item.statementCount} stmts; ${roundedCoverage}% cov)`;
    const area = item.statementCount;
    dotBody += `"${label}" [area=${area} fillcolor="${colour}"]\n`;
  });

  return dotHeader + dotBody + dotFooter;
}
function main() {
  if (process.argv[2] && process.argv[2] === "--help") {
    console.log("\nUsage: node treemap [coverage.json] [output.html]");
    return;
  }
  const inputFilename = process.argv[2] || "coverage-final.json";
  let outputFilename = process.argv[3] || "output.html";
  const inputData = JSON.parse(readFileSync(inputFilename).toString());

  if (outputFilename.toLowerCase().endsWith(".html")) {
    writeFileSync(outputFilename, treemapHtml(filter(inputData)));
  } else if (outputFilename.toLowerCase().endsWith(".svg")) {
    writeFileSync(outputFilename, treemapSvg(filter(inputData)));
  } else {
    writeFileSync(outputFilename, treemapDot(filter(inputData)));
  }
}

if (require.main === module) {
  main();
}
