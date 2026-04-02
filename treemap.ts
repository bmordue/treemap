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
        coveredStatementCount: coveredStmtCount,
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

function buildRects(
  data: {
    filename: string;
    statementCount: number;
    coveredStatementCount: number;
    statementCoverage: number;
  }[],
  width: number,
  height: number
): string {
  const coverageThreshold = 0.8;

  const totalStmts = data
    .map((d) => d.statementCount)
    .reduce((a, b) => a + b, 0);

  if (totalStmts === 0) {
    return "";
  }

  console.log(`Found ${totalStmts} statements in ${data.length} files.`);

  let svgBody = "";
  let remainingHeight = height;
  let remainingWidth = width;
  let currX = 0;
  let currY = 0;
  let remainingStmts = totalStmts;
  data
    .sort((a, b) => {
      return a.statementCount > b.statementCount ? -1 : 1;
    })
    .forEach((item) => {
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
      svgBody += `<g>
        <rect x="${currX}" y="${currY}" width="${rectWidth}" height="${rectHeight}" fill="${colour}" stroke="white" stroke-width="2" rx="4" opacity="${opacity}" role="img" tabindex="0" aria-label="${item.filename}: ${item.statementCount} statements, ${roundedCoverage}% coverage">
          <title>${item.filename}: ${item.statementCount} statements (${roundedCoverage}% covered)</title>
        </rect>`;

      if (rectWidth > 60 && rectHeight > 40) {
        const midX = currX + rectWidth / 2;
        const midY = currY + rectHeight / 2;
        const maxChars = Math.floor((rectWidth - 10) / 6);
        const name =
          item.filename.length > maxChars && maxChars > 3
            ? item.filename.substring(0, maxChars - 3) + "..."
            : item.filename;
        svgBody += `
        <text x="${midX}" y="${midY - 5}" class="rect-label" dominant-baseline="middle" text-anchor="middle" aria-hidden="true" style="pointer-events: none;">${name}</text>
        <text x="${midX}" y="${midY + 7}" class="rect-sublabel" dominant-baseline="middle" text-anchor="middle" aria-hidden="true" style="pointer-events: none;">${roundedCoverage}%</text>`;
      }
      svgBody += `</g>`;

      if (horizontal) {
        currX += rectWidth;
        remainingWidth -= rectWidth;
      } else {
        currY += rectHeight;
        remainingHeight -= rectHeight;
      }
      remainingStmts -= item.statementCount;
    });

  return svgBody;
}

function treemapSvg(
  data: {
    filename: string;
    statementCount: number;
    coveredStatementCount: number;
    statementCoverage: number;
  }[]
): string {
  const width = 400;
  const height = 200;
  const legendY = height + 20;
  const summaryY = height + 60;
  const svgHeight = height + 75;

  const totalStmts = data.reduce((acc, d) => acc + d.statementCount, 0);
  const totalCovered = data.reduce((acc, d) => acc + d.coveredStatementCount, 0);
  const overallCoverage = totalStmts > 0 ? Math.round((totalCovered / totalStmts) * 100) : 0;

  const rects = buildRects(data, width, height);

  if (!rects) {
    console.warn("No coverage data found to visualize.");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${svgHeight}" role="img" aria-label="Treemap - No Data Found">
  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    </style>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2" rx="4" />
  <text x="${width / 2}" y="${height / 2}" dominant-baseline="middle" text-anchor="middle" fill="#6c757d" font-size="14">No Coverage Data Found</text>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${svgHeight}" role="img" aria-label="Treemap">
  <defs>
    <linearGradient id="low-cov-gradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d55e00" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#d55e00" stop-opacity="1" />
    </linearGradient>
    <style>
      rect { transition: filter 0.2s, transform 0.2s, outline 0.2s; outline: none; cursor: pointer; transform-origin: center; transform-box: fill-box; }
      rect:hover, rect:focus-visible { filter: brightness(1.1); transform: scale(1.02); outline: 2px solid #333; outline-offset: 1px; }
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      .legend-label { font-size: 9px; }
      .legend-note { font-size: 7px; fill: #666; }
      .rect-label { font-size: 10px; font-weight: bold; fill: #333; }
      .rect-sublabel { font-size: 8px; fill: #333; }
      .summary-text { font-size: 10px; font-weight: bold; fill: #333; }
    </style>
  </defs>
  <rect x="0" y="0" width="${width}" height="${svgHeight}" fill="white" />
  <g>${rects}</g>
  <g aria-label="Legend">
    <rect x="0" y="${legendY}" width="12" height="12" fill="#009e73" opacity="0.5" rx="2"/>
    <text x="16" y="${legendY + 10}" class="legend-label">High Coverage (&gt;80%)</text>
    <rect x="120" y="${legendY}" width="12" height="12" fill="url(#low-cov-gradient)" rx="2"/>
    <text x="136" y="${legendY + 10}" class="legend-label">Low Coverage (&le;80%)</text>
    <text x="245" y="${legendY + 10}" class="legend-note">* Higher opacity = lower percentage.</text>
    <text x="0" y="${summaryY}" class="summary-text">Overall Coverage: ${overallCoverage}% (${totalStmts} statements)</text>
  </g>
</svg>`;
}

function treemapHtml(
  data: {
    filename: string;
    statementCount: number;
    coveredStatementCount: number;
    statementCoverage: number;
  }[]
) {
  const svg = treemapSvg(data);
  const totalStmts = data.reduce((acc, d) => acc + d.statementCount, 0);
  const totalCovered = data.reduce((acc, d) => acc + d.coveredStatementCount, 0);
  const overallCoverage = totalStmts > 0 ? Math.round((totalCovered / totalStmts) * 100) : 0;

  return `<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 2rem; background: #f8f9fa; }
    .treemap-container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .header { margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
    .title { font-size: 1.5rem; font-weight: bold; color: #1a202c; margin: 0; }
    .summary { font-size: 1rem; color: #4a5568; margin-top: 0.5rem; }
    svg { width: 100%; height: auto; display: block; border: 1px solid #eee; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="treemap-container">
    <div class="header">
      <h1 class="title">Code Coverage Treemap</h1>
      <div class="summary">Overall Coverage: <strong>${overallCoverage}%</strong> (${totalCovered}/${totalStmts} statements)</div>
    </div>
    ${svg}
  </div>
</body>
</html>`;
}

// graphviz dot file output, using the "patchwork" layout
function treemapDot(
  data: {
    filename: string;
    statementCount: number;
    coveredStatementCount: number;
    statementCoverage: number;
  }[]
) {
  const coverageThreshold = 0.8;
  const totalStmts = data.reduce((acc, d) => acc + d.statementCount, 0);
  const totalCovered = data.reduce((acc, d) => acc + d.coveredStatementCount, 0);
  const overallCoverage = totalStmts > 0 ? Math.round((totalCovered / totalStmts) * 100) : 0;
  const dotHeader = `graph {
    layout=patchwork
    node [style=filled]
    label="Overall Coverage: ${overallCoverage}% (${totalStmts} statements)"`;
  let dotBody = "\n";
  const dotFooter = "\n}";

  if (data.length === 0) {
    return (
      dotHeader +
      '\n"No Coverage Data Found" [shape=none]\n' +
      dotFooter
    );
  }

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
    console.log("\nUsage: node treemap [coverage.json] [output.{html|svg|dot}]");
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
