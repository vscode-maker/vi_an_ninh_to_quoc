
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '../data_import');
const file = 'bo_luat.csv';

function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

async function main() {
    const filePath = path.join(DATA_DIR, file);
    console.log(`Reading ${filePath}...`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const content = fileContent.charCodeAt(0) === 0xFEFF ? fileContent.slice(1) : fileContent;

    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    console.log(`Found ${records.length} records.`);

    const dataToInsert = records.map((record) => {
        const newRecord = {};
        for (const [key, value] of Object.entries(record)) {
            if (key === 'id_bo_luat') { newRecord['idBoLuat'] = value; continue; }
            if (key === 'toi_danh') { newRecord['toiDanh'] = value; continue; }

            // Standard camel
            const camelKey = snakeToCamel(key);
            newRecord[camelKey] = value === '' ? null : value;
        }
        return newRecord;
    });

    console.log('Sample record:', dataToInsert[0]);

    try {
        const result = await prisma.boLuat.createMany({
            data: dataToInsert,
            // skipDuplicates: true
        });
        console.log(`Success! Inserted ${result.count}`);
    } catch (e) {
        console.error('Insert Error:', e);
    }
}

main().finally(() => prisma.$disconnect());
