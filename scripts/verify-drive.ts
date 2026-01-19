
import { uploadToDrive } from '../lib/google-drive';
import fs from 'fs';
import path from 'path';

// Manual .env parser
try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Handle quotes
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                // Handle newlines in value (basic)
                value = value.replace(/\\n/g, '\n');
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.error('Error loading .env', e);
}

// Mock File object for Node.js environment (since File is a Browser API)
class NodeFile extends Blob {
    name: string;
    lastModified: number;

    constructor(bits: any[], name: string, options?: any) {
        super(bits, options);
        this.name = name;
        this.lastModified = Date.now();
    }
}

// Polyfill File if not available
if (typeof File === 'undefined') {
    (global as any).File = NodeFile;
}

async function main() {
    console.log('--- Testing Google Drive Upload ---');

    // Create a dummy file
    const testContent = 'Hello, this is a test upload from the PC01 System verification script.';
    const buffer = Buffer.from(testContent);
    const fileName = `test_upload_${Date.now()}.txt`;

    // Create a File-like object (using Blob/Buffer logic compatible with uploadToDrive expectance if it uses arrayBuffer)
    // uploadToDrive uses `file.arrayBuffer()`, so we need to ensure our mock supports it.
    // Node's Blob implements arrayBuffer.

    const file = new File([buffer], fileName, { type: 'text/plain' });

    console.log(`Uploading ${fileName}...`);
    const result = await uploadToDrive(file);

    if (result.error) {
        console.error('Upload Failed:', result.error);
        process.exit(1);
    } else {
        console.log('Upload Success!');
        console.log('File ID:', result.fileId);
        console.log('Name:', result.name);
        console.log('URL:', result.url);
        console.log('Thumbnail:', result.thumbnail);
    }
}

main().catch(console.error);
