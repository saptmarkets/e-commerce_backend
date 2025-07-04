#!/usr/bin/env python3
"""
Simple tkinter test to verify GUI is working
"""

import sys

def test_tkinter():
    print("🔍 Testing tkinter...")
    
    try:
        import tkinter as tk
        from tkinter import ttk, messagebox
        print("✅ tkinter imported successfully")
        
        # Create a simple test window
        print("🔍 Creating test window...")
        root = tk.Tk()
        root.title("Tkinter Test")
        root.geometry("300x200")
        
        # Add some widgets
        label = tk.Label(root, text="✅ Tkinter is working!", font=("Arial", 14))
        label.pack(pady=20)
        
        button = tk.Button(
            root, 
            text="Close Test", 
            command=root.destroy,
            bg="#4CAF50",
            fg="white",
            font=("Arial", 12)
        )
        button.pack(pady=10)
        
        info_label = tk.Label(root, text="If you can see this window, tkinter is working correctly.")
        info_label.pack(pady=10)
        
        print("✅ Test window created successfully")
        print("🔍 Starting tkinter main loop...")
        print("   (Close the test window to continue)")
        
        # Start the main loop
        root.mainloop()
        
        print("✅ Tkinter test completed successfully!")
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import tkinter: {e}")
        print("You may need to install tkinter:")
        print("  - On Ubuntu/Debian: sudo apt-get install python3-tk")
        print("  - On CentOS/RHEL: sudo yum install tkinter")
        print("  - On Windows: tkinter should be included with Python")
        return False
        
    except Exception as e:
        print(f"❌ Error testing tkinter: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("================================")
    print("   TKINTER TEST")
    print("================================")
    print(f"Python version: {sys.version}")
    print()
    
    if test_tkinter():
        print()
        print("✅ Tkinter is working correctly!")
        print("The issue with server_killer.py is likely something else.")
        print("Try running debug_server_killer.py for more details.")
    else:
        print()
        print("❌ Tkinter is not working properly.")
        print("Please fix tkinter installation before running server_killer.py")
    
    print()
    input("Press Enter to exit...")

if __name__ == "__main__":
    main() 