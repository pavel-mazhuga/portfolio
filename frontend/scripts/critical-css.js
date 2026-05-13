import Beasties from 'beasties';
import fs from 'fs';
import path from 'path';

const getHtmlDir = () => {
    const astroBuildPath = path.join(process.cwd(), 'build');

    if (fs.existsSync(astroBuildPath)) {
        return astroBuildPath;
    } else {
        throw new Error('Build directory not found. Please run "pnpm build" first.');
    }
};

const htmlDir = getHtmlDir();

// Function to get all CSS files
const getCssFiles = () => {
    const cssDir = '.next/static/css';
    if (!fs.existsSync(cssDir)) return [];

    return fs
        .readdirSync(cssDir)
        .filter((file) => file.endsWith('.css'))
        .map((file) => path.join(cssDir, file));
};

// Function to process CSS files for beasties comments
const processCssFiles = (cssFiles, restore = false) => {
    cssFiles.forEach((cssFile) => {
        if (fs.existsSync(cssFile)) {
            let cssContent = fs.readFileSync(cssFile, 'utf8');

            if (restore) {
                // Restore /*! beasties: comments
                cssContent = cssContent.replace(/\/\* beasties:/g, '/*! beasties:');
            } else {
                // Replace /*! beasties: with /* beasties: for processing
                cssContent = cssContent.replace(/\/\*! beasties:/g, '/* beasties:');
            }

            fs.writeFileSync(cssFile, cssContent, 'utf8');
        }
    });
};

// Function to read and process each HTML file
const processFiles = async (dir) => {
    const cssFiles = getCssFiles();

    // Process CSS files - replace /*! beasties: with /* beasties:
    processCssFiles(cssFiles, false);

    // Function to process a single HTML file
    const processFile = async (filePath) => {
        let htmlContent = fs.readFileSync(filePath, 'utf8');

        // Fix CSS paths for Beasties
        htmlContent = htmlContent.replace(/\/_next\//g, '.next/');

        const beasties = new Beasties({
            reduceInlineStyles: false,
            inlineFonts: true,
            allowRules: ['#__next', '.main', '.page'],
        });

        try {
            console.log(`Processing ${filePath}...`);
            const result = await beasties.process(htmlContent);
            if (result && typeof result === 'string') {
                // Restore original paths
                let processedHtml = result.replace(/\.next\//g, '/_next/');
                fs.writeFileSync(filePath, processedHtml, 'utf8');
            } else {
                console.log(`No valid result for: ${filePath}`);
                // Fallback: write original content
                fs.writeFileSync(filePath, htmlContent.replace(/\.next\//g, '/_next/'), 'utf8');
            }
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error.message);
            // Fallback: write original content
            fs.writeFileSync(filePath, htmlContent.replace(/\.next\//g, '/_next/'), 'utf8');
        }
    };

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            await processFiles(filePath); // Recurse into subdirectories
        } else if (path.extname(file) === '.html') {
            await processFile(filePath); // Process HTML file
        }
    }
};

processFiles(htmlDir).catch(console.error);
