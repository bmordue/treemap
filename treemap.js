"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// treemap.ts
var fs_1 = require("fs");
function filter(data) {
    var files = [];
    for (var prop in data) {
        var item = data[prop];
        if (item.path) {
            var tokens = item.path.split("\\");
            var stmtCount = 0;
            var coveredStmtCount = 0;
            for (var entry in item.s) {
                stmtCount++;
                if (item.s[entry] > 0)
                    coveredStmtCount++;
            }
            var coverage = coveredStmtCount / stmtCount;
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
function treemapSvg(data) {
    var coverageThreshold = 0.8;
    var width = 400;
    var height = 200;
    var svgHeader = "<html> <svg width=".concat(width, " height=").concat(height, "> <g> ");
    var svgBody = "";
    var svgFooter = "</g> </svg> </html>";
    var totalStmts = data.map(function (d) { return d.statementCount; }).reduce(function (a, b) { return a + b; });
    console.log("Found ".concat(totalStmts, " statements in ").concat(data.length, " files."));
    var remainingHeight = height;
    var remainingWidth = width;
    var currX = 0;
    var currY = 0;
    var remainingStmts = totalStmts;
    data
        .sort(function (a, b) {
        return a.statementCount > b.statementCount ? -1 : 1;
    })
        .forEach(function (item, i) {
        // const vertical = i % 2;
        var horizontal = remainingHeight < remainingWidth;
        var rectWidth;
        var rectHeight;
        if (horizontal) {
            rectWidth = (remainingWidth * item.statementCount) / remainingStmts;
            rectHeight = remainingHeight;
        }
        else {
            rectWidth = remainingWidth;
            rectHeight = (remainingWidth * item.statementCount) / remainingStmts;
        }
        var colour = item.statementCoverage > coverageThreshold ? "green" : "red";
        var opacity = item.statementCoverage > coverageThreshold
            ? 0.5
            : 1 - item.statementCoverage;
        var svgRect = "<rect x=\"".concat(currX, "\" y=\"").concat(currY, "\" width=\"").concat(rectWidth, "\" height=").concat(rectHeight, " fill=").concat(colour, " stroke=\"black\" stroke-width=\"5\" opacity=\"").concat(opacity, "\"> <title>").concat(item.filename, ":").concat(item.statementCount, " (").concat(Math.round(item.statementCoverage * 100), "%)</title> </rect>");
        svgBody += svgRect;
        if (horizontal) {
            currX += rectWidth;
            remainingWidth -= rectWidth;
        }
        else {
            currY += rectHeight;
            remainingHeight -= rectHeight;
        }
        remainingStmts -= item.statementCount;
    });
    return svgHeader + svgBody + svgFooter;
}
// graphviz dot file output, using the "patchwork" layout
function treemapDot(data) {
    var coverageThreshold = 0.8;
    var dotHeader = "graph {\n    layout=patchwork\n    node [style=filled]";
    var dotBody = "\n";
    var dotFooter = "\n}";
    data.forEach(function (item) {
        var colour = item.statementCoverage > coverageThreshold ? "green" : "red";
        var label = "".concat(item.filename, "\n(").concat(item.statementCount, " stmts; ").concat(item.statementCoverage, " cov)");
        var area = item.statementCount;
        dotBody += "\"".concat(label, "\" [area=").concat(area, " fillcolor=").concat(colour, "]\n");
    });
    return dotHeader + dotBody + dotFooter;
}
function main() {
    if (process.argv[2] && process.argv[2] === "--help") {
        console.log("\nUsage: node treemap [coverage.json] [output.html]");
        return;
    }
    var inputFilename = process.argv[2] || "coverage-final.json";
    var outputFilename = process.argv[3] || "output.html";
    var inputData = JSON.parse((0, fs_1.readFileSync)(inputFilename).toString());
    (0, fs_1.writeFileSync)(outputFilename, treemapDot(filter(inputData)));
}
if (require.main === module) {
    main();
}
