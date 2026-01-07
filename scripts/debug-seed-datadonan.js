
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '../data_import');
const file = 'data_don_an .csv';

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
            if (key === 'id_data_don_an') {
                newRecord['id'] = value;
                continue;
            }
            const camelKey = snakeToCamel(key);
            newRecord[camelKey] = value === '' ? null : value;
        }
        return newRecord;
    });

    console.log('Sample record:', dataToInsert[0]);

    try {
        const result = await prisma.dataDonAn.createMany({
            data: dataToInsert,
            // skipDuplicates: true // validation errors might be hidden
        });
        console.log(`Success! Inserted ${result.count}`);
    } catch (e) {
        console.error('Insert Error:', e);
    }
}

main().finally(() => prisma.$disconnect());
