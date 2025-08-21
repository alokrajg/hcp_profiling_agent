#!/usr/bin/env python3
"""
Startup script for the HCP Profiling Backend Server.
"""

import subprocess
import sys
import os

def start_server():
    """Start the FastAPI server."""
    
    print("🚀 Starting HCP Profiling Backend Server")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("app"):
        print("❌ Error: Please run this script from the backend directory")
        print("   cd backend && python start_server.py")
        return False
    
    # Check if virtual environment is activated
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: Virtual environment not detected")
        print("   Please activate the virtual environment first:")
        print("   source .venv/bin/activate")
    
    try:
        print("🔧 Starting server on http://127.0.0.1:8001")
        print("📚 API Documentation: http://127.0.0.1:8001/docs")
        print("🔄 Auto-reload enabled")
        print("\nPress Ctrl+C to stop the server")
        print("-" * 50)
        
        # Start the server
        subprocess.run([
            "uvicorn", "app.main:app", 
            "--host", "127.0.0.1", 
            "--port", "8001", 
            "--reload"
        ])
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    start_server()
