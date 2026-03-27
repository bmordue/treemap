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

function buildRects(
  data: {
    filename: string;
    statementCount: number;
    statementCoverage: number;
  }[],
  width: number,
  height: number
): string {
  const coverageThreshold = 0.8;

  const totalStmts = data.map((d) => d.statementCount).reduce((a, b) => a + b);
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
      svgBody += `<rect x="${currX}" y="${currY}" width="${rectWidth}" height="${rectHeight}" fill="${colour}" stroke="white" stroke-width="2" rx="4" opacity="${opacity}" role="img" tabindex="0" aria-label="${item.filename}: ${item.statementCount} statements, ${roundedCoverage}% coverage"> <title>${item.filename}: ${item.statementCount} statements (${roundedCoverage}% covered)</title> </rect>`;

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
    statementCoverage: number;
  }[]
): string {
  const width = 400;
  const height = 200;
  const legendY = height + 20;
  const svgHeight = height + 50;

  const rects = buildRects(data, width, height);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${svgHeight}" role="img" aria-label="Treemap">
  <defs>
    <style>
      rect { transition: filter 0.2s, outline 0.2s; outline: none; cursor: pointer; }
      rect:hover, rect:focus-visible { filter: brightness(1.2); outline: 2px solid #333; outline-offset: 1px; }
      .legend-label { font-family: sans-serif; font-size: 9px; }
      .legend-note { font-family: sans-serif; font-size: 7px; fill: #666; }
    </style>
  </defs>
  <g>${rects}</g>
  <g aria-label="Legend">
    <rect x="0" y="${legendY}" width="12" height="12" fill="#009e73" opacity="0.5" rx="2"/>
    <text x="16" y="${legendY + 10}" class="legend-label">High Coverage (&gt;80%)</text>
    <rect x="120" y="${legendY}" width="12" height="12" fill="#d55e00" opacity="0.5" rx="2"/>
    <text x="136" y="${legendY + 10}" class="legend-label">Low Coverage (&le;80%)</text>
    <text x="0" y="${legendY + 25}" class="legend-note">* For low coverage, higher opacity indicates lower percentage.</text>
  </g>
</svg>`;
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
    rect:focus-visible { outline: 3px solid #333; outline-offset: 1px; }
    .legend { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; font-size: 0.9rem; }
    .legend-row { display: flex; gap: 1rem; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; }
    .legend-color { width: 1rem; height: 1rem; border-radius: 2px; }
    .legend-note { font-size: 0.75rem; color: #666; font-style: italic; }
  </style>
</head>
<body>
  <div class="treemap-container">
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
