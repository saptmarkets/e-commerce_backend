# Smart Tree Usage Guide for SaptMarkets Project

## Installation

Smart Tree has been integrated into this project to provide efficient directory visualization for both human viewing and AI analysis.

### Quick Install (Windows)

Run the installation script:
```powershell
.\install-smart-tree.ps1
```

### Manual Installation

If you prefer to install manually:

1. **Install Rust** (if not already installed):
   - Visit https://rustup.rs/
   - Follow the installation instructions

2. **Install Smart Tree**:
   ```bash
   cargo install smart-tree
   ```

## Basic Usage

### In Terminal

```bash
# Show directory tree (default view)
st

# Show only 3 levels deep
st --max-depth 3

# Show with file sizes
st --size

# Search for specific files
st --find "*.js"
```

### Within Cursor IDE

1. **Open Terminal** in Cursor (Ctrl+`)
2. Navigate to your project directory
3. Use Smart Tree commands

## Useful Commands for Development

### 1. Quick Overview
```bash
# Get a quick overview of project structure
st -m classic --max-depth 3
```

### 2. AI-Optimized Output
```bash
# When sharing code structure with AI assistants
st -m ai

# Even more compressed for large projects
st -m quantum-semantic
```

### 3. Documentation Generation
```bash
# Generate markdown documentation
st -m markdown > docs/PROJECT_STRUCTURE.md

# Create a visual diagram
st -m mermaid > docs/structure-diagram.md
```

### 4. Finding Files
```bash
# Find all JavaScript/TypeScript files
st --type js,jsx,ts,tsx

# Find files by name pattern
st --find "*.test.js"

# Find files containing specific text
st --search "TODO"
```

### 5. Analyzing Code Size
```bash
# Show file sizes
st --size

# Find large files
st --min-size 1M

# Sort by size
st --sort size
```

## Integration with Cursor AI

When using Cursor's AI features, you can leverage Smart Tree to provide better context:

1. **Before asking about project structure**:
   ```bash
   st -m ai -z
   ```
   Copy the output and include it in your prompt for better context.

2. **For specific module analysis**:
   ```bash
   st admin/ -m ai
   ```

3. **To understand dependencies**:
   ```bash
   st --type json --find "package.json"
   ```

## Project-Specific Aliases

The `.smarttree` configuration file includes these aliases:

- `st overview` - Quick 3-level overview
- `st docs` - Generate markdown documentation
- `st ai` - AI-friendly compressed output
- `st src` - Show only source files

## Tips for Cursor IDE

1. **Add to Cursor Terminal**:
   - You can save frequently used Smart Tree commands as tasks in Cursor

2. **Use with AI Chat**:
   - When discussing project structure with Cursor AI, run `st -m ai` first
   - Copy the output to provide context

3. **Quick Navigation**:
   - Use `st --find` to quickly locate files
   - The output can be copied to navigate faster

## Advanced Features

### Semantic Grouping
```bash
# Group files by their purpose
st --semantic
```

### Export Formats
```bash
# JSON format for processing
st -m json > structure.json

# CSV for spreadsheets
st -m csv > structure.csv

# HTML for web viewing
st -m html > structure.html
```

### Performance Mode
```bash
# Stream output for huge directories
st --stream

# Compress output
st -z
```

## Troubleshooting

1. **Command not found**: Restart your terminal after installation
2. **Permission denied**: Run PowerShell as Administrator
3. **Slow performance**: Use `--stream` flag for large directories

## More Information

- GitHub: https://github.com/8b-is/smart-tree
- Full documentation: See the project README on GitHub 