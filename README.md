# Treemap Coverage Visualizer

Generate treemap visualizations from Jest coverage data to quickly identify code coverage patterns across your project files.

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Usage
```bash
node built/treemap.js [coverage.json] [output.html]
```

### Using npm scripts
```bash
npm run start [coverage.json] [output.html]
```

### Examples

Generate treemap from default coverage file:
```bash
npm run start
```

Generate from specific coverage file:
```bash
npm run start path/to/coverage.json my-treemap.html
```

## Input Format

Expects Jest coverage JSON format with coverage objects containing:
- `path`: File path
- `s`: Statement coverage data (object with statement IDs and hit counts)

Example:
```json
{
  "file1": {
    "path": "src/components/Button.js",
    "s": {
      "0": 1,
      "1": 1,
      "2": 0
    }
  }
}
```

## Output

Creates a Graphviz DOT file that can be rendered as a treemap visualization. Files are colored based on coverage:
- **Green**: >= 80% coverage  
- **Red**: < 80% coverage

The size of each rectangle represents the number of statements in the file.

## Development

```bash
npm run build    # Build TypeScript
npm run dev      # Watch mode
npm run clean    # Clean build files
```

## Requirements

- Node.js
- TypeScript
- Jest coverage data in JSON format
