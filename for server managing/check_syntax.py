#!/usr/bin/env python3
"""
Simple syntax checker for server_killer.py
"""

import ast
import sys

def check_syntax(filename):
    print(f"🔍 Checking syntax of {filename}...")
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        # Try to parse the file
        ast.parse(source_code)
        print("✅ Syntax is valid!")
        return True
        
    except FileNotFoundError:
        print(f"❌ File {filename} not found!")
        return False
        
    except SyntaxError as e:
        print(f"❌ Syntax Error found:")
        print(f"   Line {e.lineno}: {e.text.strip() if e.text else 'Unknown'}")
        print(f"   Error: {e.msg}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    print("================================")
    print("   SYNTAX CHECKER")
    print("================================")
    print()
    
    # Check server_killer.py
    if check_syntax("server_killer.py"):
        print()
        print("✅ server_killer.py syntax is valid!")
        print("The issue might be a runtime error.")
        print("Try running debug_server_killer.py to see runtime errors.")
    else:
        print()
        print("❌ Found syntax errors in server_killer.py")
        print("Please fix the syntax errors before running the app.")
    
    print()
    input("Press Enter to exit...")

if __name__ == "__main__":
    main() 