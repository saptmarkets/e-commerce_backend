# Enhanced Multi-Server Manager

A powerful GUI application for managing multiple development servers with support for various server types including npm, React Native, Node.js, and more.

## 🚀 Features

### Server Types Supported
- **🔧 npm run dev** - Development server
- **🚀 npm start** - Production server  
- **📱 React Native Metro** - Metro bundler with cache reset
- **🤖 Android Build** - React Native Android app
- **🍎 iOS Build** - React Native iOS app
- **🧶 Yarn Dev** - Yarn development server
- **🎯 Yarn Start** - Yarn production server
- **⚡ Node.js** - Direct Node.js execution
- **🔌 API Server** - Node.js API server

### Key Features
- **Multi-Server Management** - Run multiple servers simultaneously
- **Quick Start** - One-click full-stack development setup
- **Port Management** - Find and kill processes by port
- **Project Management** - Save and manage project directories
- **Real-time Output** - View server logs in real-time
- **Process Control** - Start, stop, and monitor individual servers
- **Enhanced UI** - Color-coded buttons with icons

## 📋 Requirements

```bash
pip install -r requirements.txt
```

Required packages:
- tkinter (usually included with Python)
- subprocess
- json
- threading
- queue

## 🎯 Usage

### Starting the Application
```bash
python server_killer.py
```

Or use the test script:
```bash
python test_server_killer.py
```

### Quick Start Setup
1. **Add Projects**: Use the "Browse" button to add your project directories
2. **Save Projects**: Give each project a name and save it
3. **Quick Start**: Click "⚡ QUICK START" to automatically start backend + React Native
4. **Individual Servers**: Use the colored buttons to start specific server types

### Port Management
1. Go to the "Kill Servers" tab
2. Enter a port number (3000, 5000, 8081, etc.)
3. Click "Find Processes" to see what's running
4. Click "Kill Processes" to terminate them

## 🛠️ Configuration

The app automatically saves configuration in `config.json`:

```json
{
  "saved_ports": ["3000", "5000", "8081", "5055"],
  "projects": {
    "backend": "C:/path/to/backend",
    "frontend": "C:/path/to/frontend",
    "mobile": "C:/path/to/react-native-app"
  }
}
```

## 🔥 Quick Start Feature

The Quick Start feature automatically:
1. Detects backend projects (names containing "backend")
2. Detects React Native projects (names containing "delivery", "react", or "native")
3. Starts backend server first
4. Starts React Native Metro bundler after a 2-second delay

## 🎨 Server Type Colors

- **🔧 npm run dev**: Green (#4CAF50)
- **🚀 npm start**: Blue (#2196F3)
- **📱 React Native**: Orange (#FF9800)
- **🤖 Android**: Purple (#9C27B0)
- **🍎 iOS**: Blue Grey (#607D8B)
- **🧶 Yarn Dev**: Cyan (#00BCD4)
- **🎯 Yarn Start**: Teal (#009688)
- **⚡ Node.js**: Brown (#795548)
- **🔌 API Server**: Deep Orange (#FF5722)

## 📝 Batch Files

The app generates temporary batch files for each server with:
- Custom window titles
- Directory navigation
- Error handling
- Pause on completion

## 🔧 Advanced Features

### Server Process Management
- Each server runs in its own console window
- Real-time output monitoring
- Individual process control
- Automatic cleanup on exit

### UI Enhancements
- Scrollable server list
- Color-coded status indicators
- Truncated directory paths for better display
- Responsive layout with proper spacing

## 🐛 Troubleshooting

### Common Issues
1. **Port already in use**: Use the "Kill Servers" tab to free up ports
2. **Project not found**: Verify directory paths in saved projects
3. **Command not found**: Ensure npm/node/yarn are in your PATH

### Error Messages
- Check the server output window for detailed error messages
- Verify project dependencies are installed
- Ensure correct Node.js/npm versions

## 🚀 Integration with Existing Scripts

This app replaces and enhances the functionality of:
- `start-all-servers.bat`
- Manual port killing commands
- Multiple terminal windows

## 📊 Benefits

- **Centralized Management**: All servers in one interface
- **Visual Feedback**: Color-coded status and real-time logs
- **Time Saving**: Quick start eliminates manual setup
- **Error Prevention**: Automatic port conflict detection
- **Better Organization**: Project-based server management 