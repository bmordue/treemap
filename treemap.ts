// treemap.ts
import { readFileSync, writeFileSync } from "fs";
import * as path from "path";

interface FileCoverage {
  filename: string;
  fullPath: string;
  statementCount: number;
  coveredStatementCount: number;
  statementCoverage: number;
}

function filter(data: any): FileCoverage[] {
  let files: FileCoverage[] = [];
  for (const prop in data) {
    const item = data[prop];
    if (item.path) {
      const filename = path.basename(item.path.replace(/\\/g, "/"));
      const fullPath = item.path;
      let stmtCount = 0;
      let coveredStmtCount = 0;
      for (const entry in item.s) {
        stmtCount++;
        if (item.s[entry] > 0) coveredStmtCount++;
      }

      const coverage = coveredStmtCount / stmtCount;
      files.push({
        filename,
        fullPath,
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
  data: FileCoverage[],
  width: number,
  height: number
): string {
  const coverageThreshold = 0.8;

  const totalStmts = data.map((d) => d.statementCount).reduce((a, b) => a + b, 0);
  console.log(`Found ${totalStmts} statements in ${data.length} files.`);

  if (totalStmts === 0) {
    return "";
  }

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
      svgBody += `<g class="file-group" data-filename="${item.filename}" data-path="${item.fullPath}" data-statements="${item.statementCount}" data-covered="${item.coveredStatementCount}">
        <rect x="${currX}" y="${currY}" width="${rectWidth}" height="${rectHeight}" fill="${colour}" stroke="white" stroke-width="2" rx="4" opacity="${opacity}" role="button" tabindex="0" data-path="${item.fullPath}" data-filename="${item.filename}" aria-label="${item.filename}: ${item.statementCount} statements, ${roundedCoverage}% coverage. Click to copy path.">
          <title>${item.filename}: ${item.statementCount} statements (${roundedCoverage}% covered) - Click to copy path</title>
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

function treemapSvg(data: FileCoverage[]): string {
  const width = 400;
  const height = 200;
  const legendY = height + 20;
  const summaryY = height + 60;
  const svgHeight = height + 75;

  const coverageThreshold = 0.8;
  const totalStmts = data.reduce((acc, d) => acc + d.statementCount, 0);
  const totalCovered = data.reduce((acc, d) => acc + d.coveredStatementCount, 0);
  const coverageRatio = totalStmts > 0 ? totalCovered / totalStmts : 0;
  const overallCoverage = Math.round(coverageRatio * 100);
  const summaryColor = coverageRatio > coverageThreshold ? "#009e73" : "#d55e00";

  if (data.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${svgHeight}" role="img" aria-label="Treemap - No data">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#f9f9f9" stroke="#ccc" rx="8" />
  <text x="${width / 2}" y="${height / 2 - 10}" font-family="sans-serif" font-size="14" font-weight="bold" fill="#666" text-anchor="middle">No Coverage Data Found</text>
  <text x="${width / 2}" y="${height / 2 + 15}" font-family="sans-serif" font-size="10" fill="#999" text-anchor="middle">Ensure your coverage JSON is correctly formatted and not empty.</text>
</svg>`;
  }

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
      .file-group { transition: opacity 0.3s; }
      .file-group.hidden { display: none; }
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
    <text x="0" y="${summaryY}" class="summary-text">Overall Coverage: <tspan id="svg-summary-pct" fill="${summaryColor}">${overallCoverage}%</tspan> <tspan id="svg-summary-counts">(${totalCovered}/${totalStmts} statements)</tspan></text>
  </g>
</svg>`;
}

function treemapHtml(data: FileCoverage[]) {
  const svg = treemapSvg(data);
  const coverageThreshold = 0.8;
  const totalStmts = data.reduce((acc, d) => acc + d.statementCount, 0);
  const totalCovered = data.reduce((acc, d) => acc + d.coveredStatementCount, 0);
  const coverageRatio = totalStmts > 0 ? totalCovered / totalStmts : 0;
  const overallCoverage = Math.round(coverageRatio * 100);
  const summaryColor = coverageRatio > coverageThreshold ? "#009e73" : "#d55e00";

  return `<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 2rem; background: #f8f9fa; }
    .treemap-container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .header { margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
    .title { font-size: 1.5rem; font-weight: bold; color: #1a202c; margin: 0; }
    .summary { font-size: 1rem; color: #4a5568; margin-top: 0.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .summary-pct { font-weight: bold; color: ${summaryColor}; }
    .progress-bar { flex: 1; min-width: 200px; height: 8px; background: #edf2f7; border-radius: 4px; overflow: hidden; }
    .progress-inner { height: 100%; width: ${overallCoverage}%; background: ${summaryColor}; transition: width 0.3s ease, background-color 0.3s ease; }
    svg { width: 100%; height: auto; display: block; border: 1px solid #eee; border-radius: 4px; }
    .toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.875rem; opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 100; }
    .toast.show { opacity: 1; }
    .filter-container { margin-top: 1rem; display: flex; gap: 0.5rem; }
    .filter-btn { padding: 0.4rem 0.8rem; border: 1px solid #e2e8f0; border-radius: 6px; background: white; font-size: 0.75rem; color: #4a5568; cursor: pointer; transition: all 0.2s; }
    .filter-btn:hover { background: #f7fafc; border-color: #cbd5e0; }
    .filter-btn.active { background: #3182ce; color: white; border-color: #3182ce; }
    .search-container { margin-top: 0.75rem; position: relative; display: flex; align-items: center; }
    #search { width: 100%; padding: 0.6rem 1rem; padding-right: 2.5rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
    #search:focus { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1); }
    #search:focus + .search-hint { opacity: 0; visibility: hidden; }
    .search-hint { position: absolute; right: 0.75rem; pointer-events: none; transition: opacity 0.2s, visibility 0.2s; }
    kbd { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.75rem; color: #a0aec0; font-family: inherit; }
    .search-info { font-size: 0.75rem; color: #718096; margin-top: 0.4rem; min-height: 1.2em; }
    #no-results { display: none; padding: 3rem; text-align: center; color: #718096; background: #fdfdfd; border: 2px dashed #edf2f7; border-radius: 8px; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="treemap-container">
    <div class="header">
      <h1 class="title">Code Coverage Treemap</h1>
      <div class="summary">
        <span>Overall Coverage: <strong id="html-summary-pct" class="summary-pct">${overallCoverage}%</strong> <span id="html-summary-counts">(${totalCovered}/${totalStmts} statements)</span></span>
        <div class="progress-bar" aria-hidden="true"><div id="html-progress-inner" class="progress-inner"></div></div>
      </div>
      <div class="filter-container" role="tablist" aria-label="Filter by coverage">
        <button class="filter-btn active" data-filter="all" role="tab" aria-selected="true">All Files</button>
        <button class="filter-btn" data-filter="high" role="tab" aria-selected="false">High Coverage (>80%)</button>
        <button class="filter-btn" data-filter="low" role="tab" aria-selected="false">Low Coverage (≤80%)</button>
      </div>
      <div class="search-container">
        <input type="search" id="search" placeholder="Search files..." aria-label="Search files by name or path">
        <div class="search-hint"><kbd>/</kbd></div>
      </div>
      <div id="search-info" class="search-info" aria-live="polite"></div>
    </div>
    <div id="no-results">No matching files found.</div>
    ${svg}
  </div>
  <div id="toast" class="toast">Path copied to clipboard!</div>
  <script>
    let toastTimeout;
    const copyPath = (rect) => {
      if (!rect) return;
      const path = rect.getAttribute('data-path');
      const filename = rect.getAttribute('data-filename') || 'file';
      navigator.clipboard.writeText(path).then(() => {
        const toast = document.getElementById('toast');
        toast.textContent = 'Copied path for ' + filename + '!';
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2000);
      });
    };

    const svg = document.querySelector('svg');
    svg.addEventListener('click', (e) => {
      copyPath(e.target.closest('rect[data-path]'));
    });

    svg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copyPath(e.target.closest('rect[data-path]'));
      }
    });

    const searchInput = document.getElementById('search');
    const searchInfo = document.getElementById('search-info');
    const noResults = document.getElementById('no-results');
    const fileGroups = document.querySelectorAll('.file-group');
    const filterBtns = document.querySelectorAll('.filter-btn');
    let activeFilter = 'all';

    const performFilter = () => {
      const query = searchInput.value.toLowerCase();
      let visibleCount = 0;
      let totalVisibleStmts = 0;
      let totalVisibleCovered = 0;

      fileGroups.forEach(group => {
        const filename = group.getAttribute('data-filename').toLowerCase();
        const path = group.getAttribute('data-path').toLowerCase();
        const statements = parseInt(group.getAttribute('data-statements') || '0', 10);
        const covered = parseInt(group.getAttribute('data-covered') || '0', 10);
        const ratio = statements > 0 ? covered / statements : 0;

        const matchesSearch = filename.includes(query) || path.includes(query);
        let matchesFilter = true;
        if (activeFilter === 'high') matchesFilter = ratio > 0.8;
        else if (activeFilter === 'low') matchesFilter = ratio <= 0.8;

        if (matchesSearch && matchesFilter) {
          group.classList.remove('hidden');
          visibleCount++;
          totalVisibleStmts += statements;
          totalVisibleCovered += covered;
        } else {
          group.classList.add('hidden');
        }
      });

      const coverageRatio = totalVisibleStmts > 0 ? totalVisibleCovered / totalVisibleStmts : 0;
      const coveragePct = Math.round(coverageRatio * 100);
      const color = coverageRatio > 0.8 ? '#009e73' : '#d55e00';

      const updateSummary = (pctId, countId, progressId) => {
        const pctEl = document.getElementById(pctId);
        const countEl = document.getElementById(countId);
        const progressEl = document.getElementById(progressId);
        if (pctEl) {
          pctEl.textContent = coveragePct + '%';
          pctEl.style.color = color;
          if (pctEl.tagName.toLowerCase() === 'tspan') pctEl.setAttribute('fill', color);
        }
        if (countEl) countEl.textContent = '(' + totalVisibleCovered + '/' + totalVisibleStmts + ' statements)';
        if (progressEl) {
          progressEl.style.width = coveragePct + '%';
          progressEl.style.backgroundColor = color;
        }
      };

      updateSummary('html-summary-pct', 'html-summary-counts', 'html-progress-inner');
      updateSummary('svg-summary-pct', 'svg-summary-counts', null);

      if (query || activeFilter !== 'all') {
        searchInfo.textContent = 'Showing ' + visibleCount + ' of ' + fileGroups.length + ' files';
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        svg.style.display = visibleCount === 0 ? 'none' : 'block';
      } else {
        searchInfo.textContent = '';
        noResults.style.display = 'none';
        svg.style.display = 'block';
      }
    };

    searchInput.addEventListener('input', performFilter);

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        activeFilter = btn.getAttribute('data-filter');
        performFilter();
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInput.focus();
      } else if (e.key === 'Escape') {
        if (document.activeElement === searchInput) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input'));
          searchInput.blur();
        }
      }
    });
  </script>
</body>
</html>`;
}

// graphviz dot file output, using the "patchwork" layout
function treemapDot(data: FileCoverage[]) {
  const coverageThreshold = 0.8;
  const totalStmts = data.reduce((acc, d) => acc + d.statementCount, 0);
  const totalCovered = data.reduce((acc, d) => acc + d.coveredStatementCount, 0);
  const overallCoverage = totalStmts > 0 ? Math.round((totalCovered / totalStmts) * 100) : 0;
  const dotHeader = `graph {
    layout=patchwork
    node [style=filled]
    label="Overall Coverage: ${overallCoverage}% (${totalCovered}/${totalStmts} statements)"`;
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
  const filteredData = filter(inputData);

  if (filteredData.length === 0) {
    console.warn("Warning: No coverage data found in input file.");
  }

  if (outputFilename.toLowerCase().endsWith(".html")) {
    writeFileSync(outputFilename, treemapHtml(filteredData));
  } else if (outputFilename.toLowerCase().endsWith(".svg")) {
    writeFileSync(outputFilename, treemapSvg(filteredData));
  } else {
    writeFileSync(outputFilename, treemapDot(filteredData));
  }
}

if (require.main === module) {
  main();
}
