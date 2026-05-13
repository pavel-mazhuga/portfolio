/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import process from 'process';

const exts = ['.scss', '.css', '.less'];
const rootDir = path.resolve('src');
let found = false;

function walk(dir, cb) {
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p, cb);
        else if (exts.includes(path.extname(f))) cb(p);
    }
}

function checkFile(file) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    let inBlock = false,
        blockStart = 0,
        onlyComments = true;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!inBlock && /\{\s*$/.test(line)) {
            inBlock = true;
            blockStart = i;
            onlyComments = true;
            continue;
        }
        if (inBlock) {
            if (/^\s*\}/.test(line)) {
                if (onlyComments && i > blockStart + 0) {
                    found = true;
                    console.log(`❌ ${file}:${blockStart + 1}: пустой блок с пустым комментарием`);
                }
                inBlock = false;
                continue;
            }
            if (!/^\s*(\/\/.*)?$/.test(line)) {
                onlyComments = false;
            }
        }
    }
}

walk(rootDir, checkFile);

if (found) {
    process.exit(1);
}
