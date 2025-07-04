import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import subprocess
import json
import os
import re
import threading
import queue
import uuid
from typing import List, Dict, Optional
import datetime

class ServerProcess:
    """Class to manage a server process"""
    def __init__(self, project_name, directory, process, batch_file, server_type):
        self.id = str(uuid.uuid4())
        self.project_name = project_name
        self.directory = directory
        self.process = process
        self.batch_file = batch_file
        self.server_type = server_type
        self.running = True
        
    def stop(self):
        """Stop the process"""
        if self.running and self.process:
            try:
                subprocess.run(f"taskkill /F /T /PID {self.process.pid}", shell=True)
                self.running = False
                return True
            except Exception:
                return False
        return False

class ServerKiller(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Multi-Server Manager")
        self.geometry("900x700")
        self.config_file = "config.json"
        self.default_ports = ["3000", "5000", "8000", "8081", "5055"]
        self.config = self.load_config()
        
        # Define server types and their commands
        self.server_types = {
            "npm run dev": {
                "command": "npm run dev",
                "description": "Development server (npm run dev)",
                "color": "#4CAF50",
                "icon": "🔧"
            },
            "npm start": {
                "command": "npm start", 
                "description": "Production server (npm start)",
                "color": "#2196F3",
                "icon": "🚀"
            },
            "react-native start": {
                "command": "npx react-native start --reset-cache",
                "description": "React Native Metro Bundler",
                "color": "#FF9800",
                "icon": "📱"
            },
            "react-native run-android": {
                "command": "npx react-native run-android",
                "description": "Build & Run Android App",
                "color": "#9C27B0",
                "icon": "🤖"
            },
            "react-native run-ios": {
                "command": "npx react-native run-ios",
                "description": "Build & Run iOS App",
                "color": "#607D8B",
                "icon": "🍎"
            },
            "yarn dev": {
                "command": "yarn dev",
                "description": "Yarn development server",
                "color": "#00BCD4",
                "icon": "🧶"
            },
            "yarn start": {
                "command": "yarn start",
                "description": "Yarn production server",
                "color": "#009688",
                "icon": "🎯"
            },
            "node index.js": {
                "command": "node index.js",
                "description": "Node.js server (index.js)",
                "color": "#795548",
                "icon": "⚡"
            },
            "node api/index.js": {
                "command": "node api/index.js",
                "description": "Node.js API server",
                "color": "#FF5722",
                "icon": "🔌"
            }
        }
        
        # Queue for thread-safe messaging between output reader and GUI
        self.output_queue = queue.Queue()
        
        # Store running processes
        self.server_processes = {}
        
        # Store server logs persistently
        self.server_logs = {}  # {server_id: [log_lines]}
        
        self.create_widgets()
        
    def create_widgets(self):
        # Create notebook (tabs)
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Create Kill Server tab
        self.kill_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.kill_tab, text="Kill Servers")
        self.create_kill_tab_widgets()
        
        # Create Run Server tab
        self.run_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.run_tab, text="Run Servers")
        self.create_run_tab_widgets()
        
        # Create Logs tab
        self.logs_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.logs_tab, text="Server Logs")
        self.create_logs_tab_widgets()
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        status_bar = ttk.Label(self, textvariable=self.status_var, relief="sunken", anchor="w")
        status_bar.pack(side="bottom", fill="x")
        
        # Start checking the output queue
        self.check_output_queue()
    
    def create_kill_tab_widgets(self):
        # Port selection frame
        port_frame = ttk.LabelFrame(self.kill_tab, text="Port Selection")
        port_frame.pack(fill="x", padx=10, pady=10)
        
        ttk.Label(port_frame, text="Select or enter port:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        
        # Dropdown for saved ports
        self.port_var = tk.StringVar()
        self.port_dropdown = ttk.Combobox(port_frame, textvariable=self.port_var, values=self.get_all_ports())
        self.port_dropdown.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        
        # Add port button
        ttk.Button(port_frame, text="Add to Saved", command=self.save_port).grid(row=0, column=2, padx=5, pady=5)
        
        # Find and kill buttons
        button_frame = ttk.Frame(self.kill_tab)
        button_frame.pack(fill="x", padx=10, pady=5)
        
        ttk.Button(button_frame, text="Find Processes", command=self.find_processes).pack(side="left", padx=5)
        ttk.Button(button_frame, text="Kill Processes", command=self.kill_processes).pack(side="left", padx=5)
        
        # Output area
        output_frame = ttk.LabelFrame(self.kill_tab, text="Output")
        output_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Scrollable text widget for output
        self.kill_output_text = tk.Text(output_frame, width=70, height=20)
        self.kill_output_text.pack(side="left", fill="both", expand=True)
        
        scrollbar = ttk.Scrollbar(output_frame, command=self.kill_output_text.yview)
        scrollbar.pack(side="right", fill="y")
        self.kill_output_text.config(yscrollcommand=scrollbar.set)
    
    def create_run_tab_widgets(self):
        # ===== Top Frame: Project Selection =====
        project_frame = ttk.LabelFrame(self.run_tab, text="Project Selection")
        project_frame.pack(fill="x", padx=10, pady=10)
        
        # Project selection
        select_frame = ttk.Frame(project_frame)
        select_frame.pack(fill="x", padx=10, pady=5)
        
        ttk.Label(select_frame, text="Select project:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        
        self.projects = self.config.get("projects", {})
        self.project_names = list(self.projects.keys())
        
        self.project_var = tk.StringVar()
        self.project_dropdown = ttk.Combobox(select_frame, textvariable=self.project_var, values=self.project_names, width=30)
        self.project_dropdown.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        self.project_dropdown.bind("<<ComboboxSelected>>", self.on_project_selected)
        
        # Browse button
        ttk.Button(select_frame, text="Browse", command=self.browse_directory).grid(row=0, column=2, padx=5, pady=5)
        
        # Directory path
        path_frame = ttk.Frame(project_frame)
        path_frame.pack(fill="x", padx=10, pady=5)
        
        ttk.Label(path_frame, text="Directory:").pack(side="left", padx=5)
        self.dir_path_var = tk.StringVar()
        ttk.Entry(path_frame, textvariable=self.dir_path_var, width=50).pack(side="left", fill="x", expand=True, padx=5)
        
        # Project name and save frame
        save_frame = ttk.Frame(project_frame)
        save_frame.pack(fill="x", padx=10, pady=5)
        
        ttk.Label(save_frame, text="Project name:").pack(side="left", padx=5)
        self.project_name_var = tk.StringVar()
        ttk.Entry(save_frame, textvariable=self.project_name_var, width=20).pack(side="left", padx=5)
        ttk.Button(save_frame, text="Save Project", command=self.save_project).pack(side="left", padx=5)
        ttk.Button(save_frame, text="Delete Project", command=self.delete_project).pack(side="left", padx=5)
        
        # ===== Server Type Buttons Frame =====
        buttons_frame = ttk.LabelFrame(self.run_tab, text="Start Servers")
        buttons_frame.pack(fill="x", padx=10, pady=10)
        
        # Create buttons in a grid layout
        buttons_grid = ttk.Frame(buttons_frame)
        buttons_grid.pack(fill="x", padx=10, pady=10)
        
        # Configure grid columns to be equal width
        for i in range(3):
            buttons_grid.columnconfigure(i, weight=1, uniform="button")
        
        row = 0
        col = 0
        
        for server_type, config in self.server_types.items():
            btn = tk.Button(
                buttons_grid,
                text=f"{config['icon']} {server_type}",
                command=lambda st=server_type: self.run_server(st),
                bg=config['color'],
                fg="white",
                font=("Arial", 10, "bold"),
                height=2,
                relief="raised",
                borderwidth=2,
                wraplength=150
            )
            btn.grid(row=row, column=col, padx=5, pady=5, sticky="ew")
            
            col += 1
            if col >= 3:
                col = 0
                row += 1
        
        # Add a "Stop All Servers" button
        stop_all_btn = tk.Button(
            buttons_grid,
            text="🛑 STOP ALL SERVERS",
            command=self.stop_all_servers,
            bg="#F44336",
            fg="white",
            font=("Arial", 11, "bold"),
            height=2,
            relief="raised",
            borderwidth=2
        )
        stop_all_btn.grid(row=row, column=col, padx=5, pady=5, sticky="ew")
        
        # Add Quick Start buttons for common project setups
        col += 1
        if col >= 3:
            col = 0
            row += 1
            
        quick_start_btn = tk.Button(
            buttons_grid,
            text="⚡ QUICK START\n(Backend + RN)",
            command=self.quick_start_full_stack,
            bg="#673AB7",
            fg="white",
            font=("Arial", 10, "bold"),
            height=2,
            relief="raised",
            borderwidth=2
        )
        quick_start_btn.grid(row=row, column=col, padx=5, pady=5, sticky="ew")
        
        # Create a separator for visual clarity
        ttk.Separator(self.run_tab, orient="horizontal").pack(fill="x", padx=10, pady=10)
        
        # ===== Bottom Frame: Running Servers and Output =====
        bottom_pane = ttk.PanedWindow(self.run_tab, orient=tk.VERTICAL)
        bottom_pane.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Running servers frame
        servers_frame = ttk.LabelFrame(bottom_pane, text="Running Servers")
        bottom_pane.add(servers_frame, weight=1)
        
        # Create a frame with a canvas for scrolling
        canvas_frame = ttk.Frame(servers_frame)
        canvas_frame.pack(side="left", fill="both", expand=True)
        
        # Create scrollbar
        scrollbar = ttk.Scrollbar(servers_frame, orient="vertical")
        scrollbar.pack(side="right", fill="y")
        
        # Create canvas
        self.servers_canvas = tk.Canvas(canvas_frame)
        self.servers_canvas.pack(side="left", fill="both", expand=True)
        
        # Configure scrollbar
        scrollbar.config(command=self.servers_canvas.yview)
        self.servers_canvas.config(yscrollcommand=scrollbar.set)
        
        # Create a frame inside the canvas to hold server widgets
        self.servers_list_frame = ttk.Frame(self.servers_canvas)
        self.servers_canvas_window = self.servers_canvas.create_window(
            (0, 0), window=self.servers_list_frame, anchor="nw"
        )
        
        # Update the scrollregion when the size of the frame changes
        self.servers_list_frame.bind("<Configure>", self.on_frame_configure)
        self.servers_canvas.bind("<Configure>", self.on_canvas_configure)
        
        # Create frame for server output
        self.output_frame = ttk.LabelFrame(bottom_pane, text="Server Output")
        bottom_pane.add(self.output_frame, weight=1)
        
        # Scrollable text widget for output
        self.run_output_text = tk.Text(self.output_frame, width=70, height=15)
        self.run_output_text.pack(side="left", fill="both", expand=True)
        
        output_scrollbar = ttk.Scrollbar(self.output_frame, command=self.run_output_text.yview)
        output_scrollbar.pack(side="right", fill="y")
        self.run_output_text.config(yscrollcommand=output_scrollbar.set)
        
        # Variable to track which server's output we're viewing
        self.current_output_server_id = None
    
    def create_logs_tab_widgets(self):
        """Create widgets for the logs tab"""
        try:
            print("Creating logs tab widgets...")
            
            # ===== Top Frame: Running Servers List =====
            servers_list_frame = ttk.LabelFrame(self.logs_tab, text="Running Servers")
            servers_list_frame.pack(fill="x", padx=10, pady=10)
            
            # Create a scrollable frame for server buttons
            servers_canvas_frame = ttk.Frame(servers_list_frame)
            servers_canvas_frame.pack(fill="x", padx=5, pady=5)
            
            # Canvas for scrolling if many servers
            self.logs_servers_canvas = tk.Canvas(servers_canvas_frame, height=80)
            self.logs_servers_canvas.pack(side="left", fill="x", expand=True)
            
            # Scrollbar for servers list
            servers_scrollbar = ttk.Scrollbar(servers_canvas_frame, orient="horizontal", command=self.logs_servers_canvas.xview)
            servers_scrollbar.pack(side="bottom", fill="x")
            self.logs_servers_canvas.config(xscrollcommand=servers_scrollbar.set)
            
            # Frame inside canvas to hold server buttons
            self.logs_servers_frame = ttk.Frame(self.logs_servers_canvas)
            self.logs_servers_canvas_window = self.logs_servers_canvas.create_window(
                (0, 0), window=self.logs_servers_frame, anchor="nw"
            )
            
            # Update scroll region when frame changes
            self.logs_servers_frame.bind("<Configure>", self.on_logs_servers_frame_configure)
            
            print(f"logs_servers_frame created: {self.logs_servers_frame}")
            
        except Exception as e:
            print(f"Error creating logs tab top section: {str(e)}")
            # Create a minimal fallback
            self.logs_servers_frame = ttk.Frame(self.logs_tab)
            self.logs_servers_frame.pack(fill="x", padx=10, pady=10)
        
        try:
            # ===== Bottom Frame: Log Display =====
            logs_display_frame = ttk.LabelFrame(self.logs_tab, text="Server Logs")
            logs_display_frame.pack(fill="both", expand=True, padx=10, pady=10)
            
            # Current server info
            self.current_log_server_var = tk.StringVar()
            self.current_log_server_var.set("No server selected")
            current_server_label = ttk.Label(
                logs_display_frame, 
                textvariable=self.current_log_server_var,
                font=("Arial", 10, "bold")
            )
            current_server_label.pack(pady=5)
            
            # Log controls frame
            log_controls_frame = ttk.Frame(logs_display_frame)
            log_controls_frame.pack(fill="x", padx=5, pady=5)
            
            # Clear logs button
            ttk.Button(
                log_controls_frame,
                text="🗑️ Clear Logs",
                command=self.clear_current_server_logs
            ).pack(side="left", padx=5)
            
            # Auto-scroll checkbox
            self.auto_scroll_var = tk.BooleanVar()
            self.auto_scroll_var.set(True)
            ttk.Checkbutton(
                log_controls_frame,
                text="Auto-scroll",
                variable=self.auto_scroll_var
            ).pack(side="left", padx=10)
            
            # Export logs button
            ttk.Button(
                log_controls_frame,
                text="💾 Export Logs",
                command=self.export_current_server_logs
            ).pack(side="left", padx=5)
            
            # Scrollable text widget for logs
            logs_text_frame = ttk.Frame(logs_display_frame)
            logs_text_frame.pack(fill="both", expand=True, padx=5, pady=5)
            
            self.logs_text = tk.Text(
                logs_text_frame, 
                width=80, 
                height=20,
                wrap=tk.WORD,
                font=("Consolas", 9)
            )
            self.logs_text.pack(side="left", fill="both", expand=True)
            
            # Scrollbar for logs
            logs_scrollbar = ttk.Scrollbar(logs_text_frame, command=self.logs_text.yview)
            logs_scrollbar.pack(side="right", fill="y")
            self.logs_text.config(yscrollcommand=logs_scrollbar.set)
            
            # Variable to track which server's logs we're viewing in logs tab
            self.current_logs_server_id = None
            
            print("Logs tab widgets created successfully")
            
        except Exception as e:
            print(f"Error creating logs tab bottom section: {str(e)}")
            # Create minimal fallback
            self.current_log_server_var = tk.StringVar()
            self.current_log_server_var.set("Logs tab error")
            self.auto_scroll_var = tk.BooleanVar()
            self.auto_scroll_var.set(True)
            self.logs_text = None
            self.current_logs_server_id = None
    
    def on_frame_configure(self, event=None):
        """Update the scroll region when the servers list frame changes"""
        if hasattr(self, 'servers_canvas') and self.servers_canvas is not None:
            self.servers_canvas.configure(scrollregion=self.servers_canvas.bbox("all"))
    
    def on_canvas_configure(self, event=None):
        """Update the window width when the canvas changes"""
        if hasattr(self, 'servers_canvas') and hasattr(self, 'servers_canvas_window'):
            canvas_width = self.servers_canvas.winfo_width()
            if canvas_width > 1:  # Avoid division by zero
                self.servers_canvas.itemconfig(self.servers_canvas_window, width=canvas_width)
    
    def on_logs_servers_frame_configure(self, event=None):
        """Update the scroll region when the servers frame changes"""
        self.logs_servers_canvas.configure(scrollregion=self.logs_servers_canvas.bbox("all"))
        # Update the window width to fit content
        canvas_width = self.logs_servers_canvas.winfo_width()
        if canvas_width > 1:  # Avoid division by zero
            self.logs_servers_canvas.itemconfig(self.logs_servers_canvas_window, width=canvas_width)
    
    def load_config(self) -> Dict:
        """Load configuration from file"""
        default_config = {
            "saved_ports": [],
            "projects": {}
        }
        
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except:
                return default_config
        return default_config
    
    def save_config(self):
        """Save configuration to file"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def get_all_ports(self) -> List[str]:
        """Get all ports (default + saved)"""
        saved_ports = self.config.get("saved_ports", [])
        # Combine default and saved ports, removing duplicates
        all_ports = list(set(self.default_ports + saved_ports))
        all_ports.sort()
        return all_ports
    
    def save_port(self):
        """Save current port to config"""
        port = self.port_var.get().strip()
        if not port:
            return
            
        if not port.isdigit():
            messagebox.showerror("Invalid Port", "Port must be a number")
            return
            
        saved_ports = self.config.get("saved_ports", [])
        if port not in saved_ports:
            saved_ports.append(port)
            self.config["saved_ports"] = saved_ports
            self.port_dropdown['values'] = self.get_all_ports()
            self.save_config()
            self.status_var.set(f"Port {port} saved to dropdown list")
    
    def find_processes(self):
        """Find processes using the specified port"""
        port = self.port_var.get().strip()
        if not port:
            messagebox.showerror("Error", "Please select or enter a port")
            return
            
        self.status_var.set(f"Finding processes on port {port}...")
        self.kill_output_text.delete(1.0, tk.END)
        
        try:
            # Run netstat command
            cmd = f'netstat -ano | findstr :{port}'
            result = subprocess.run(cmd, shell=True, text=True, capture_output=True)
            
            if not result.stdout.strip():
                self.kill_output_text.insert(tk.END, f"No processes found using port {port}\n")
                self.status_var.set("No processes found")
            else:
                self.kill_output_text.insert(tk.END, "Found processes:\n\n")
                self.kill_output_text.insert(tk.END, "Proto  Local Address          Foreign Address        State           PID\n")
                self.kill_output_text.insert(tk.END, "-" * 75 + "\n")
                self.kill_output_text.insert(tk.END, result.stdout)
                self.status_var.set(f"Found processes on port {port}")
        except Exception as e:
            self.kill_output_text.insert(tk.END, f"Error: {str(e)}\n")
            self.status_var.set("Error during process search")
    
    def kill_processes(self):
        """Kill processes using the specified port"""
        port = self.port_var.get().strip()
        if not port:
            messagebox.showerror("Error", "Please select or enter a port")
            return
        
        self.status_var.set(f"Killing processes on port {port}...")
        
        try:
            # First find the processes
            cmd = f'netstat -ano | findstr :{port}'
            result = subprocess.run(cmd, shell=True, text=True, capture_output=True)
            
            if not result.stdout.strip():
                self.kill_output_text.insert(tk.END, f"No processes found using port {port}\n")
                self.status_var.set("No processes found")
                return
            
            # Extract PIDs from netstat output
            pids = set()
            for line in result.stdout.splitlines():
                # Use regex to extract PID from the end of the line
                pid_match = re.search(r'\s+(\d+)$', line)
                if pid_match:
                    pids.add(pid_match.group(1))
            
            if not pids:
                self.kill_output_text.insert(tk.END, "Could not identify PIDs from the output\n")
                return
                
            # Kill each PID
            self.kill_output_text.insert(tk.END, "\nKilling processes:\n")
            for pid in pids:
                kill_cmd = f'taskkill /PID {pid} /F'
                self.kill_output_text.insert(tk.END, f"Running: {kill_cmd}\n")
                
                kill_result = subprocess.run(kill_cmd, shell=True, text=True, capture_output=True)
                
                if kill_result.returncode == 0:
                    self.kill_output_text.insert(tk.END, f"Successfully killed process with PID {pid}\n")
                else:
                    self.kill_output_text.insert(tk.END, f"Failed to kill PID {pid}: {kill_result.stderr}\n")
            
            self.status_var.set(f"Killed processes on port {port}")
        except Exception as e:
            self.kill_output_text.insert(tk.END, f"Error: {str(e)}\n")
            self.status_var.set("Error during process termination")
    
    def browse_directory(self):
        """Open file dialog to select a directory"""
        directory = filedialog.askdirectory(title="Select Project Directory")
        if directory:
            self.dir_path_var.set(directory)
            # Extract project name from directory path for suggested name
            suggested_name = os.path.basename(directory)
            self.project_name_var.set(suggested_name)
    
    def save_project(self):
        """Save project directory with name"""
        directory = self.dir_path_var.get().strip()
        project_name = self.project_name_var.get().strip()
        
        if not directory or not os.path.isdir(directory):
            messagebox.showerror("Error", "Please select a valid directory")
            return
            
        if not project_name:
            messagebox.showerror("Error", "Please enter a project name")
            return
        
        # Save to config
        self.config.setdefault("projects", {})
        self.config["projects"][project_name] = directory
        self.save_config()
        
        # Update dropdown
        self.project_names = list(self.config["projects"].keys())
        self.project_dropdown['values'] = self.project_names
        self.project_var.set(project_name)
        
        self.status_var.set(f"Project '{project_name}' saved")
    
    def delete_project(self):
        """Delete the selected project from saved list"""
        project_name = self.project_var.get().strip()
        
        if not project_name or project_name not in self.config.get("projects", {}):
            messagebox.showerror("Error", "Please select a valid project to delete")
            return
            
        # Remove from config
        del self.config["projects"][project_name]
        self.save_config()
        
        # Update dropdown
        self.project_names = list(self.config["projects"].keys())
        self.project_dropdown['values'] = self.project_names
        self.project_var.set("")
        self.dir_path_var.set("")
        
        self.status_var.set(f"Project '{project_name}' deleted")
    
    def on_project_selected(self, event=None):
        """Handle project selection from dropdown"""
        project_name = self.project_var.get()
        if project_name in self.config.get("projects", {}):
            directory = self.config["projects"][project_name]
            self.dir_path_var.set(directory)
            self.project_name_var.set(project_name)
    
    def run_server(self, server_type):
        """Run a server using the specified type"""
        directory = self.dir_path_var.get().strip()
        project_name = self.project_name_var.get().strip()
        
        if not directory or not os.path.isdir(directory):
            messagebox.showerror("Error", "Please select a valid directory")
            return
            
        if not project_name:
            # Use directory name as default project name
            project_name = os.path.basename(directory)
            self.project_name_var.set(project_name)
        
        try:
            self.start_specific_project(project_name, directory, server_type)
            self.status_var.set(f"{server_type} server started for {project_name}")
        except Exception as e:
            messagebox.showerror("Error", str(e))
            self.status_var.set("Error starting server")
    
    def add_server_to_ui(self, server_process):
        """Add a server entry to the UI"""
        # Create a frame for this server
        server_frame = ttk.Frame(self.servers_list_frame, relief="raised", borderwidth=1)
        server_frame.pack(fill="x", padx=5, pady=5)
        server_frame.server_id = server_process.id  # Store server ID for future reference
        
        # Create inner frame for better layout
        inner_frame = ttk.Frame(server_frame)
        inner_frame.pack(fill="x", padx=10, pady=5)
        
        # Get server type configuration
        server_config = self.server_types.get(server_process.server_type, {})
        icon = server_config.get("icon", "⚡")
        color = server_config.get("color", "#666666")
        
        # Add server type icon and name
        type_label = ttk.Label(
            inner_frame, 
            text=f"{icon} {server_process.server_type}",
            font=("Arial", 10, "bold")
        )
        type_label.pack(side="left", padx=5)
        
        # Add project name
        project_label = ttk.Label(
            inner_frame, 
            text=f"Project: {server_process.project_name}",
            font=("Arial", 9)
        )
        project_label.pack(side="left", padx=10)
        
        # Add directory (truncated if too long)
        dir_text = server_process.directory
        if len(dir_text) > 50:
            dir_text = "..." + dir_text[-47:]
        
        dir_label = ttk.Label(inner_frame, text=f"Dir: {dir_text}", font=("Arial", 8))
        dir_label.pack(side="left", padx=10, fill="x", expand=True)
        
        # Create button frame
        button_frame = ttk.Frame(inner_frame)
        button_frame.pack(side="right", padx=5)
        
        # Add button to view output
        view_btn = tk.Button(
            button_frame, 
            text="👁️ View",
            command=lambda id=server_process.id: self.show_server_output(id),
            bg="#2196F3",
            fg="white",
            font=("Arial", 8, "bold"),
            relief="raised",
            borderwidth=1
        )
        view_btn.pack(side="left", padx=2)
        
        # Add button to stop server
        stop_btn = tk.Button(
            button_frame, 
            text="🛑 Stop",
            command=lambda id=server_process.id: self.stop_specific_server(id),
            bg="#F44336",
            fg="white",
            font=("Arial", 8, "bold"),
            relief="raised",
            borderwidth=1
        )
        stop_btn.pack(side="left", padx=2)
        
        # Store reference to the frame
        server_process.ui_frame = server_frame
        
        # Update the canvas scroll region
        self.servers_list_frame.update_idletasks()
        self.servers_canvas.configure(scrollregion=self.servers_canvas.bbox("all"))
        
        # Also add to logs tab
        self.add_server_to_logs_tab(server_process)
    
    def remove_server_from_ui(self, server_id):
        """Remove a server entry from the UI"""
        if server_id in self.server_processes:
            server = self.server_processes[server_id]
            if hasattr(server, 'ui_frame'):
                server.ui_frame.destroy()
            
            # Clean up batch file
            try:
                if os.path.exists(server.batch_file):
                    os.remove(server.batch_file)
            except:
                pass
                
            # Remove from processes dict
            del self.server_processes[server_id]
            
            # Clear output if this was the current server
            if self.current_output_server_id == server_id:
                self.current_output_server_id = None
                self.run_output_text.delete(1.0, tk.END)
                self.output_frame.config(text="Server Output")
        
        # Also remove from logs tab
        self.remove_server_from_logs_tab(server_id)
    
    def show_server_output(self, server_id):
        """Show the output for a specific server"""
        if server_id in self.server_processes:
            server = self.server_processes[server_id]
            self.current_output_server_id = server_id
            
            # Update the output frame title
            self.output_frame.config(text=f"Server Output: {server.project_name}")
            
            # Clear and update the output text
            self.run_output_text.delete(1.0, tk.END)
            
            # Show existing logs for this server
            if server_id in self.server_logs:
                for log_line in self.server_logs[server_id]:
                    self.run_output_text.insert(tk.END, log_line)
                self.run_output_text.see(tk.END)
            
            # Set status
            self.status_var.set(f"Viewing output for {server.project_name}")
    
    def stop_specific_server(self, server_id):
        """Stop a specific server"""
        if server_id in self.server_processes:
            server = self.server_processes[server_id]
            
            try:
                if server.stop():
                    self.status_var.set(f"Stopped server for {server.project_name}")
                    # Add a message to the logs
                    stop_message = "\nServer stopped by user\n"
                    self.add_log_line(server_id, stop_message)
                    
                    # Also add to run output if this is the current server
                    if self.current_output_server_id == server_id:
                        self.run_output_text.insert(tk.END, stop_message)
                else:
                    self.status_var.set(f"Failed to stop server for {server.project_name}")
            except Exception as e:
                self.status_var.set(f"Error stopping server: {str(e)}")
            
            # Remove from UI after a short delay
            self.after(1000, lambda: self.remove_server_from_ui(server_id))
    
    def stop_all_servers(self):
        """Stop all running servers"""
        for server_id in list(self.server_processes.keys()):
            self.stop_specific_server(server_id)
    
    def read_process_output(self, server_id, process):
        """Thread function to read output from the process"""
        try:
            for line in iter(process.stdout.readline, ''):
                if not line:
                    break
                # Add the output to the queue for the main thread to handle
                self.output_queue.put((server_id, line))
            
            # Process has ended
            end_message = "\nServer process has ended\n"
            self.output_queue.put((server_id, end_message))
            
            # Remove server from UI after a delay
            self.after(1000, lambda: self.remove_server_from_ui(server_id))
            
        except Exception as e:
            error_message = f"\nError reading process output: {str(e)}\n"
            self.output_queue.put((server_id, error_message))
            
            # Remove server from UI after a delay
            self.after(1000, lambda: self.remove_server_from_ui(server_id))
    
    def check_output_queue(self):
        """Check the output queue and update the UI if there's data"""
        try:
            while not self.output_queue.empty():
                server_id, line = self.output_queue.get_nowait()
                
                # Add to logs storage for persistent viewing
                self.add_log_line(server_id, line)
                
                # If this is the current server being viewed in run tab, update the output
                if self.current_output_server_id == server_id:
                    self.run_output_text.insert(tk.END, line)
                    self.run_output_text.see(tk.END)  # Scroll to end
        except queue.Empty:
            pass
        finally:
            # Schedule to check again
            self.after(100, self.check_output_queue)
    
    def on_closing(self):
        """Handle application closing"""
        if self.server_processes:
            if messagebox.askyesno("Quit", "There are running servers. Stop them and quit?"):
                self.stop_all_servers()
                self.after(1000, self.destroy)  # Give time for servers to stop
            else:
                return
        else:
            self.destroy()
    
    def quick_start_full_stack(self):
        """Quick start for full stack development (Backend + React Native)"""
        projects = self.config.get("projects", {})
        
        if not projects:
            messagebox.showerror("Error", "No projects configured. Please add projects first.")
            return
        
        # Look for backend project
        backend_project = None
        rn_project = None
        
        for name, directory in projects.items():
            if "backend" in name.lower():
                backend_project = (name, directory)
            elif "delivery" in name.lower() or "react" in name.lower() or "native" in name.lower():
                rn_project = (name, directory)
        
        if not backend_project:
            messagebox.showwarning("Warning", "No backend project found. Please configure a project with 'backend' in the name.")
            return
        
        # Start backend server
        try:
            self.start_specific_project(backend_project[0], backend_project[1], "node api/index.js")
            self.status_var.set("Started backend server...")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to start backend: {str(e)}")
            return
        
        # Start React Native Metro if RN project exists
        if rn_project:
            try:
                # Small delay to let backend start
                self.after(2000, lambda: self.start_specific_project(rn_project[0], rn_project[1], "react-native start"))
                self.status_var.set("Starting React Native Metro...")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to start React Native: {str(e)}")
        else:
            messagebox.showinfo("Info", "Backend started. No React Native project found for auto-start.")
    
    def start_specific_project(self, project_name, directory, server_type):
        """Start a specific project with given server type"""
        if not os.path.isdir(directory):
            raise Exception(f"Directory not found: {directory}")
        
        try:
            # Create a temporary batch file to run the command
            safe_project_name = re.sub(r'[^\w\-_\.]', '_', project_name)
            batch_file = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), 
                f"run_{safe_project_name}_{server_type.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.bat"
            )
            
            command = self.server_types.get(server_type, {}).get("command", server_type)
            
            with open(batch_file, 'w') as f:
                f.write(f'@echo off\n')
                f.write(f'title {project_name} - {server_type}\n')
                f.write(f'cd /d "{directory}"\n')
                f.write(f'echo Starting {server_type} for {project_name}...\n')
                f.write(f'echo Directory: {directory}\n')
                f.write(f'echo.\n')
                f.write(f'{command}\n')
                f.write(f'echo.\n')
                f.write(f'echo Server stopped. Press any key to close...\n')
                f.write(f'pause >nul\n')
            
            # Start the process using the batch file
            process = subprocess.Popen(
                [batch_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            
            # Create ServerProcess object and add to dictionary
            server_process = ServerProcess(project_name, directory, process, batch_file, server_type)
            self.server_processes[server_process.id] = server_process
            
            # Start a thread to read the output
            threading.Thread(
                target=self.read_process_output,
                args=(server_process.id, process),
                daemon=True
            ).start()
            
            # Add server to UI
            self.add_server_to_ui(server_process)
            
            # Show this server's output
            self.show_server_output(server_process.id)
            
        except Exception as e:
            raise Exception(f"Failed to start {server_type} for {project_name}: {str(e)}")
    
    def add_server_to_logs_tab(self, server_process):
        """Add a server button to the logs tab"""
        # Safety check: ensure logs tab widgets are initialized
        if not hasattr(self, 'logs_servers_frame') or self.logs_servers_frame is None:
            print(f"Warning: logs_servers_frame not initialized, skipping logs tab update for {server_process.project_name}")
            return
        
        try:
            # Get server type configuration for styling
            server_config = self.server_types.get(server_process.server_type, {})
            icon = server_config.get("icon", "⚡")
            color = server_config.get("color", "#666666")
            
            # Create server button
            server_btn = tk.Button(
                self.logs_servers_frame,
                text=f"{icon}\n{server_process.project_name}",
                command=lambda: self.show_logs_for_server(server_process.id),
                bg=color,
                fg="white",
                font=("Arial", 9, "bold"),
                width=12,
                height=3,
                relief="raised",
                borderwidth=2
            )
            server_btn.pack(side="left", padx=5, pady=5)
            
            # Store reference to button for removal later
            server_process.logs_button = server_btn
            
            # Initialize logs for this server
            if server_process.id not in self.server_logs:
                self.server_logs[server_process.id] = []
            
            # Update scroll region (with safety checks)
            if hasattr(self, 'logs_servers_canvas') and self.logs_servers_canvas is not None:
                self.logs_servers_frame.update_idletasks()
                self.logs_servers_canvas.configure(scrollregion=self.logs_servers_canvas.bbox("all"))
                
        except Exception as e:
            print(f"Error adding server to logs tab: {str(e)}")
            # Continue without failing the entire server start process
    
    def remove_server_from_logs_tab(self, server_id):
        """Remove a server button from the logs tab"""
        try:
            if server_id in self.server_processes:
                server = self.server_processes[server_id]
                if hasattr(server, 'logs_button') and server.logs_button is not None:
                    server.logs_button.destroy()
            
            # Clear logs if this was the current server (with safety checks)
            if hasattr(self, 'current_logs_server_id') and self.current_logs_server_id == server_id:
                self.current_logs_server_id = None
                if hasattr(self, 'current_log_server_var') and self.current_log_server_var is not None:
                    self.current_log_server_var.set("No server selected")
                if hasattr(self, 'logs_text') and self.logs_text is not None:
                    self.logs_text.delete(1.0, tk.END)
            
            # Remove logs from storage
            if server_id in self.server_logs:
                del self.server_logs[server_id]
                
        except Exception as e:
            print(f"Error removing server from logs tab: {str(e)}")
            # Continue without failing
    
    def show_logs_for_server(self, server_id):
        """Show logs for a specific server in the logs tab"""
        if server_id not in self.server_processes:
            return
        
        server = self.server_processes[server_id]
        self.current_logs_server_id = server_id
        
        # Update the current server label
        self.current_log_server_var.set(f"Viewing logs for: {server.project_name} ({server.server_type})")
        
        # Clear and display logs
        self.logs_text.delete(1.0, tk.END)
        
        if server_id in self.server_logs:
            for log_line in self.server_logs[server_id]:
                self.logs_text.insert(tk.END, log_line)
        
        # Auto-scroll to bottom if enabled
        if self.auto_scroll_var.get():
            self.logs_text.see(tk.END)
    
    def add_log_line(self, server_id, line):
        """Add a log line to a server's log storage"""
        try:
            if server_id not in self.server_logs:
                self.server_logs[server_id] = []
            
            # Add line to storage
            self.server_logs[server_id].append(line)
            
            # Limit log size to prevent memory issues (keep last 1000 lines)
            if len(self.server_logs[server_id]) > 1000:
                self.server_logs[server_id] = self.server_logs[server_id][-1000:]
            
            # If this server is currently being viewed in logs tab, update display (with safety checks)
            if (hasattr(self, 'current_logs_server_id') and 
                self.current_logs_server_id == server_id and 
                hasattr(self, 'logs_text') and 
                self.logs_text is not None):
                
                self.logs_text.insert(tk.END, line)
                if (hasattr(self, 'auto_scroll_var') and 
                    self.auto_scroll_var is not None and 
                    self.auto_scroll_var.get()):
                    self.logs_text.see(tk.END)
                    
        except Exception as e:
            print(f"Error adding log line: {str(e)}")
            # Continue without failing
    
    def clear_current_server_logs(self):
        """Clear logs for the currently viewed server"""
        if self.current_logs_server_id:
            # Clear from storage
            self.server_logs[self.current_logs_server_id] = []
            # Clear from display
            self.logs_text.delete(1.0, tk.END)
            self.status_var.set("Logs cleared")
    
    def export_current_server_logs(self):
        """Export current server logs to a file"""
        if not self.current_logs_server_id or self.current_logs_server_id not in self.server_processes:
            messagebox.showwarning("Warning", "No server selected")
            return
        
        server = self.server_processes[self.current_logs_server_id]
        
        # Ask user for file location
        from tkinter import filedialog
        filename = filedialog.asksaveasfilename(
            title="Export Server Logs",
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialvalue=f"{server.project_name}_{server.server_type}_logs.txt"
        )
        
        if filename:
            try:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"Server Logs Export\n")
                    f.write(f"Project: {server.project_name}\n")
                    f.write(f"Server Type: {server.server_type}\n")
                    f.write(f"Directory: {server.directory}\n")
                    f.write(f"Export Time: {datetime.datetime.now()}\n")
                    f.write("=" * 50 + "\n\n")
                    
                    if self.current_logs_server_id in self.server_logs:
                        for log_line in self.server_logs[self.current_logs_server_id]:
                            f.write(log_line)
                
                messagebox.showinfo("Success", f"Logs exported to {filename}")
                self.status_var.set(f"Logs exported to {filename}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to export logs: {str(e)}")
                self.status_var.set("Error exporting logs")

if __name__ == "__main__":
    app = ServerKiller()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop() 