#!/bin/bash

echo "User-Agent: *" > robots.txt
echo "Allow: *" >> robots.txt
echo "Disallow: */?" >> robots.txt
echo "Disallow: */&" >> robots.txt
echo "Disallow: /admin" >> robots.txt
echo "Disallow: /file=" >> robots.txt
echo "Disallow: /*.pdf" >> robots.txt

echo "" >> robots.txt
echo "User-Agent: Yandex" >> robots.txt
echo "Allow: *" >> robots.txt
echo "Disallow: */?" >> robots.txt
echo "Disallow: */&" >> robots.txt
echo "Disallow: /admin" >> robots.txt
echo "Disallow: /file=" >> robots.txt
echo "Disallow: /*.pdf" >> robots.txt

echo "" >> robots.txt
echo "Sitemap: https://pavelmazhuga.com/sitemap.xml" >> robots.txt

mv robots.txt build/robots.txt
