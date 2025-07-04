# Smart Tree Cheatsheet 🌳

## Essential Commands

### Basic Usage
```bash
st                      # Show tree (default)
st -h, --help          # Show help
st --version           # Show version
```

### Display Modes
```bash
st -m classic          # 🌳 Beautiful tree (default)
st -m ai               # 🤖 AI-optimized (80% smaller!)
st -m hex              # 🔢 Hexadecimal format
st -m markdown         # 📝 Markdown documentation
st -m json             # 🔧 JSON format
st -m mermaid          # 🧜‍♀️ Diagram format
st -m digest           # 💊 One-line summary
```

### Filtering
```bash
st --max-depth 3       # Limit depth
st --find "*.js"       # Find files by pattern
st --type py           # Python files only
st --search "TODO"     # Search inside files
st --min-size 1M       # Files larger than 1MB
st --max-size 100K     # Files smaller than 100KB
```

### Performance
```bash
st --stream            # 🌊 Stream output (huge dirs)
st -z                  # 🗜️ Compress output
st --no-emoji          # Remove emojis
st --no-color          # Remove colors
```

### Time Filters
```bash
st --newer-than 2024-01-01   # Recent files
st --older-than 2023-01-01   # Old files
```

## Quick Examples

```bash
# Project overview (3 levels)
st -m classic --max-depth 3

# For AI/Cursor chat
st -m ai -z

# Generate documentation
st -m markdown > PROJECT.md

# Find all test files
st --find "*.test.js"

# Large files check
st --min-size 5M --sort size
```

## Pro Tips 💡

1. **For Cursor AI**: Use `st -m ai` before asking about project structure
2. **Save tokens**: Add `-z` flag for compression
3. **Quick check**: Use `st -m digest` for one-line summary
4. **Documentation**: `st -m markdown` creates instant docs

## Cursor IDE Integration

1. Open terminal: `Ctrl + ``
2. Run `st -m ai` 
3. Copy output to AI chat for context
4. Use `st --find` to locate files quickly 