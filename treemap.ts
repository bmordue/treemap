// treemap.ts
import * as fileData from "./coverage-final.json";

function treemap(data: any) {
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
        statementCoverage: coverage,
      });
    }
  }
  console.log(
    files
      .map((d) => `${d.filename}: ${Math.round(d.statementCoverage * 100)}%`)
      .join("\n")
  );
}

function main() {
  treemap(fileData);
}

main();
