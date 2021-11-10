#!/bin/bash

echo "Input file name:"

read file_name

if [[ ! -f $file_name ]]
then
    echo "File not found!"
    exit 0
fi

echo "Input chunk size(by_line):"

read chunk_size

split -l $chunk_size  -d --additional-suffix=.json $file_name "file"
