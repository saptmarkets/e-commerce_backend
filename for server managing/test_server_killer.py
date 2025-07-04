#!/usr/bin/env python3
"""
Test script for the enhanced Server Killer app
"""

import sys
import os

# Add the current directory to the path so we can import the server_killer module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from server_killer import ServerKiller
    
    print("🚀 Starting Enhanced Multi-Server Manager...")
    print("Features:")
    print("  ✅ Multiple server types (npm, React Native, Node.js)")
    print("  ✅ Quick start for full-stack development")
    print("  ✅ Better UI with icons and colors")
    print("  ✅ Enhanced process management")
    print("  ✅ Port killing functionality")
    print()
    
    app = ServerKiller()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()
    
except ImportError as e:
    print(f"❌ Error importing server_killer: {e}")
    print("Make sure server_killer.py is in the same directory")
except Exception as e:
    print(f"❌ Error starting application: {e}")
    input("Press Enter to exit...") 