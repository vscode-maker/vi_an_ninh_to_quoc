
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(__dirname, '../data_import/bo_luat.csv');
    if (!fs.existsSync(filePath)) {
        console.error('File data_import/bo_luat.csv not found');
        process.exit(1);
    }

    console.log('Reading bo_luat.csv...');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    // Handle BOM
    const content = fileContent.charCodeAt(0) === 0xFEFF ? fileContent.slice(1) : fileContent;

    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`Found ${records.length} records in CSV. Preparing to import...`);

    const dataToInsert = records.map((record) => {
        const newRecord = {};
        for (const [key, value] of Object.entries(record)) {
            // Handle empty strings as null
            const val = value === '' ? null : value;

            // Map id_bo_luat explicitly (though camelCase conversion handles it too)
            if (key === 'id_bo_luat') {
                newRecord['idBoLuat'] = val;
                continue;
            }

            // Convert snake_case to camelCase for other fields
            // Example: toi_danh -> toiDanh, muc_hinh_phat_cao_nhat -> mucHinhPhatCaoNhat
            const camelKey = key.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
            newRecord[camelKey] = val;
        }
        return newRecord;
    });

    console.log('Clearing existing BoLuat data...');
    await prisma.boLuat.deleteMany({});

    console.log(`Importing ${dataToInsert.length} records...`);
    const result = await prisma.boLuat.createMany({
        data: dataToInsert,
        skipDuplicates: true,
    });

    console.log(`✅ Successfully imported ${result.count} records into 'boLuat' table.`);
}

main()
    .catch((e) => {
        console.error('Error importing data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
