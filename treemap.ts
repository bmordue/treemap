// treemap.ts
import { readFileSync, writeFileSync } from "fs";

// Configuration constants
const COVERAGE_THRESHOLD = 0.8;

// Type definitions
interface CoverageItem {
  path?: string;
  s: Record<string, number>;
}

interface CoverageData {
  [key: string]: CoverageItem;
}

interface FileMetrics {
  filename: string;
  statementCount: number;
  statementCoverage: number;
}

/**
 * Validates that the input data conforms to Jest coverage format
 * @param data - Unknown input data to validate
 * @returns True if data is valid coverage data
 */
function validateCoverageData(data: unknown): data is CoverageData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const coverageData = data as Record<string, unknown>;
  for (const key in coverageData) {
    const item = coverageData[key];
    if (!item || typeof item !== 'object') continue;
    
    const coverageItem = item as Record<string, unknown>;
    if (coverageItem.s && typeof coverageItem.s === 'object') {
      return true; // At least one valid coverage item found
    }
  }
  return false;
}

/**
 * Filters and transforms coverage data into file metrics
 * @param data - Jest coverage data object
 * @returns Array of file metrics with coverage information
 */
function filter(data: CoverageData): FileMetrics[] {
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

/**
 * Generates SVG treemap visualization (currently unused)
 * @param data - Array of file metrics
 * @returns SVG string representation
 */
function treemapSvg(data: FileMetrics[]): string {
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
        item.statementCoverage > COVERAGE_THRESHOLD ? "green" : "red";
      const opacity =
        item.statementCoverage > COVERAGE_THRESHOLD
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

/**
 * Generates Graphviz DOT format treemap visualization
 * @param data - Array of file metrics  
 * @returns DOT format string for treemap visualization
 */
function treemapDot(data: FileMetrics[]): string {
  const dotHeader = "graph {\n    layout=patchwork\n    node [style=filled]";
  let dotBody = "\n";
  const dotFooter = "\n}";

  data.forEach((item) => {
    const colour = item.statementCoverage > COVERAGE_THRESHOLD ? "green" : "red";
    const label = `${item.filename}\n(${item.statementCount} stmts; ${item.statementCoverage} cov)`;
    const area = item.statementCount;
    dotBody += `"${label}" [area=${area} fillcolor=${colour}]\n`;
  });

  return dotHeader + dotBody + dotFooter;
}
/**
 * Main application entry point
 * Processes command line arguments and generates treemap visualization
 */
function main(): void {
  if (process.argv[2] && process.argv[2] === "--help") {
    console.log("\nUsage: node treemap [coverage.json] [output.html]");
    console.log("\nConverts Jest coverage JSON to treemap visualization");
    console.log("\nArguments:");
    console.log("  coverage.json  Input coverage file (default: coverage-final.json)");
    console.log("  output.html    Output file (default: output.html)");
    return;
  }
  
  const inputFilename = process.argv[2] || "coverage-final.json";
  const outputFilename = process.argv[3] || "output.html";
  
  try {
    const inputData = JSON.parse(readFileSync(inputFilename, 'utf8'));
    
    if (!validateCoverageData(inputData)) {
      console.error(`Error: Invalid coverage data format in ${inputFilename}`);
      console.error("Expected Jest coverage JSON format with coverage items containing 's' property");
      process.exit(1);
    }
    
    const filteredData = filter(inputData);
    if (filteredData.length === 0) {
      console.error(`Warning: No coverage data found in ${inputFilename}`);
      process.exit(1);
    }
    
    const output = treemapDot(filteredData);
    writeFileSync(outputFilename, output);
    console.log(`✓ Generated treemap: ${outputFilename}`);
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error(`Error: Could not find input file: ${inputFilename}`);
      } else if (error.message.includes('JSON')) {
        console.error(`Error: Invalid JSON in ${inputFilename}`);
      } else {
        console.error(`Error: ${error.message}`);
      }
    } else {
      console.error(`Unknown error occurred`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
