import os
import sys

def update_version(new_version):
    # Update version.py
    with open('version.py', 'w') as f:
        f.write(f"VERSION = '{new_version}'")
    
    # Update .version file
    with open('.version', 'w') as f:
        f.write(new_version)
    
    print(f"Version updated to {new_version}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python update_version.py <new_version>")
        sys.exit(1)
    
    update_version(sys.argv[1]) 