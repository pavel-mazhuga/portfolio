#!/bin/bash

echo "User-Agent: *" > robots.txt
echo "Disallow: /" >> robots.txt
mv robots.txt build/robots.txt
