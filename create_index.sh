#!/bin/bash

######

# This script creates an "index.ts" file in the directory provided as its argument.
# It then goes through all .ts files and directories in this directory,
# and adds them as "export * from './[filename without .ts or directory name]'" to the "index.ts" file.
# If it encounters a subdirectory, it runs itself in that subdirectory, thus starting a recursion.

# This script is useful when working with TypeScript projects where you want to create a single entry point 
# for all your .ts files and directories. It automates the process of creating and updating "index.ts" files, 
# which can be tedious and error-prone when done manually, especially in large projects. 
# By running this script, you ensure that your "index.ts" files are always up-to-date, 
# even when new files or directories are added. This can be particularly useful in scenarios 
# where you want to expose a public API for your TypeScript modules, as it allows consumers 
# of your modules to import from a single location.

# To automate the process of creating and updating "index.ts" files every time you build your project, 
# you can add this script to your "build" command in package.json. For example, if your TypeScript 
# source files are in the "src" directory and your build command is "tsc", you can modify it as follows:
# "build": "./create_index.sh ./src && tsc"
# This will ensure that your "index.ts" files are updated before every build. 
# Make sure to make the script executable by running "chmod +x create_index.sh".

# After downloading this script from a gist or any other source, 
# don't forget to make it executable by running the following command:
# chmod +x create_index.sh
# This will set the execute permission on the script and allow it to be run as a program.

######

# Store the absolute path to the script in a variable
SCRIPT=$(readlink -f "$0")

# Check if directory is provided
if [ -z "$1" ]
then
    echo "No directory supplied"
    exit 1
fi

# Navigate to the directory
cd "$1"

# Create index.ts file
touch index.ts

# Empty the index.ts file
> index.ts

# Iterate over all .ts files and directories
for file in *
do
    # If it's a directory, run the script recursively and add it to index.ts
    if [ -d "$file" ]
    then
        "$SCRIPT" "$file"
        echo "export * from './$file';" >> index.ts
    elif [ "${file: -3}" == ".ts" ] && [ "$file" != "index.ts" ]
    then
        # If it's a .ts file, add it to index.ts
        echo "export * from './${file%.*}';" >> index.ts
    fi
done