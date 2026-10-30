"""Build the main game using its dependency-free Node TypeScript build."""
from pathlib import Path
import subprocess
subprocess.run(["node", "build.cjs"], cwd=Path(__file__).resolve().parent, check=True)
