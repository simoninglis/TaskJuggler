# Configuration for csc shell script
CSC_PROJECT_NAME="TaskJuggler Web UI"
CSC_PROJECT_DESC="Interactive JavaScript UI prototype with DHTMLX Gantt"
CSC_INCLUDE_TESTS=true
CSC_MAX_FILE_SIZE=200000  # Increase for larger JS files

# Optional: Define custom file lists
CSC_ADDITIONAL_FILES=(
    "server/serve-with-debug.py"
    "src/data/sample-gantt.json"
    "CLAUDE.md"
    "README.md"
)