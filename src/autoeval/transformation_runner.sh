#!/usr/bin/env bash
#
# Script Name: run_transformation.sh
# Description: Executes the data transformation process using transformation.py.
#              Converts input JSON data into a processed output JSON file.
#
# Notes:
#   - Ensure Python 3 and required dependencies are installed.
#   - The transformation.py script must be in the same directory or in your PATH.


# Define input and output file paths
INPUT_FILE="/path/to/input_file.json"
OUTPUT_FILE="/path/to/output_file.json"

echo "Running transformation..."
python utils/transformation.py \
    --input  "$INPUT_FILE" \
    --output "$OUTPUT_FILE"

echo "Transformation complete. Output saved to $OUTPUT_FILE"
