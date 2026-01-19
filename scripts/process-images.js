const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../public/logo.jpg');
const outputDir = path.join(__dirname, '../public/images');
const outputFile = path.join(outputDir, 'logo.png');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function processImages() {
    try {
        console.log(`Converting ${inputFile} to PNG...`);

        // 1. Convert to PNG (Main Logo)
        await sharp(inputFile)
            .png()
            .toFile(outputFile);
        console.log(`Created ${outputFile}`);

        // 2. Create Thumbnails
        const sizes = [32, 64, 192, 512];

        for (const size of sizes) {
            const thumbPath = path.join(outputDir, `logo-${size}.png`);
            await sharp(inputFile)
                .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .png()
                .toFile(thumbPath);
            console.log(`Created thumbnail: ${thumbPath}`);
        }

        console.log("Image processing complete!");

    } catch (error) {
        console.error("Error processing images:", error);
    }
}

processImages();
