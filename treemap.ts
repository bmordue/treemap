// treemap.ts
import { readFileSync, writeFileSync } from "fs";

function filter(data: any) {
  let files = [];
  for (const prop in data) {
    const item = data[prop];
    if (item.path) {
      const tokens = item.path.split("\\");
      let stmtCount = 0;
      let coveredStmtCount = 0;
      for (const entry in item.s) {
        stmtCount++;
        if (item.s[entry] > 0) coveredStmtCount++;
      }

      const coverage = coveredStmtCount / stmtCount;
      files.push({
        filename: tokens[tokens.length - 1],
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
  let svgHeader = `<html> <svg width=${width} height=${height}> <g> `;
  let svgBody = "";
  let svgFooter = "</g> </svg> </html>";

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
        rectHeight = (remainingWidth * item.statementCount) / remainingStmts;
      }

      const colour =
        item.statementCoverage > coverageThreshold ? "green" : "red";
      const opacity =
        item.statementCoverage > coverageThreshold
          ? 0.5
          : 1 - item.statementCoverage;
      let svgRect = `<rect x="${currX}" y="${currY}" width="${rectWidth}" height=${rectHeight} fill=${colour} stroke="black" stroke-width="5" opacity="${opacity}"> <title>${
        item.filename
      }:${item.statementCount} (${Math.round(
        item.statementCoverage * 100
      )}%)</title> </rect>`;

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
    const colour = item.statementCoverage > coverageThreshold ? "green" : "red";
    const label = `${item.filename}\n(${item.statementCount} stmts; ${item.statementCoverage} cov)`;
    const area = item.statementCount;
    dotBody += `"${label}" [area=${area} fillcolor=${colour}]\n`;
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

  writeFileSync(outputFilename, treemapDot(filter(inputData)));
}

if (require.main === module) {
  main();
}
