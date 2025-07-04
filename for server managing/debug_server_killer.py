#!/usr/bin/env python3
"""
Debug version of the Enhanced Server Killer app
This version will catch and display any errors that cause the app to crash
"""

import sys
import os
import traceback

def main():
    try:
        print("🔍 Debug: Starting Enhanced Multi-Server Manager...")
        print(f"🔍 Debug: Python version: {sys.version}")
        print(f"🔍 Debug: Working directory: {os.getcwd()}")
        print()
        
        # Test imports one by one
        print("🔍 Debug: Testing imports...")
        
        try:
            import tkinter as tk
            print("✅ tkinter imported successfully")
        except ImportError as e:
            print(f"❌ Failed to import tkinter: {e}")
            input("Press Enter to exit...")
            return
        
        try:
            from tkinter import ttk, messagebox, filedialog
            print("✅ tkinter submodules imported successfully")
        except ImportError as e:
            print(f"❌ Failed to import tkinter submodules: {e}")
            input("Press Enter to exit...")
            return
        
        try:
            import subprocess
            import json
            import re
            import threading
            import queue
            import uuid
            import datetime
            print("✅ All standard modules imported successfully")
        except ImportError as e:
            print(f"❌ Failed to import standard modules: {e}")
            input("Press Enter to exit...")
            return
        
        # Try to import the main class
        print("🔍 Debug: Importing ServerKiller class...")
        try:
            from server_killer import ServerKiller
            print("✅ ServerKiller class imported successfully")
        except ImportError as e:
            print(f"❌ Failed to import ServerKiller: {e}")
            print("Make sure server_killer.py is in the same directory")
            input("Press Enter to exit...")
            return
        except Exception as e:
            print(f"❌ Error in server_killer.py: {e}")
            print("Full traceback:")
            traceback.print_exc()
            input("Press Enter to exit...")
            return
        
        # Try to create the app
        print("🔍 Debug: Creating ServerKiller instance...")
        try:
            app = ServerKiller()
            print("✅ ServerKiller instance created successfully")
        except Exception as e:
            print(f"❌ Error creating ServerKiller instance: {e}")
            print("Full traceback:")
            traceback.print_exc()
            input("Press Enter to exit...")
            return
        
        # Try to start the app
        print("🔍 Debug: Starting main loop...")
        try:
            app.protocol("WM_DELETE_WINDOW", app.on_closing)
            print("✅ Starting GUI main loop...")
            app.mainloop()
            print("✅ App closed normally")
        except Exception as e:
            print(f"❌ Error in main loop: {e}")
            print("Full traceback:")
            traceback.print_exc()
            input("Press Enter to exit...")
            return
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print("Full traceback:")
        traceback.print_exc()
        input("Press Enter to exit...")

if __name__ == "__main__":
    main() 