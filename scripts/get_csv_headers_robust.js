
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data_import');

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

files.forEach(file => {
    try {
        const filePath = path.join(dataDir, file);
        const buffer = fs.readFileSync(filePath);
        // Read clear text, assumption UTF8 mostly but handle BOM
        let content = buffer.toString('utf8');
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        const firstLine = content.split(/\r?\n/)[0];
        console.log(`\nFILE: ${file}`);
        console.log(`HEADERS: ${firstLine}`);
    } catch (e) {
        console.error(`Error ${file}: ${e.message}`);
    }
});
