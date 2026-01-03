import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export async function uploadToDrive(file: File, folderId?: string) {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!clientEmail || !privateKey || !targetFolderId) {
            console.error("Missing Google Drive Credentials or Folder ID in .env");
            return { error: "Missing Configuration: Please check GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID" };
        }

        // Clean up private key: unescape newlines
        const formattedKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '');

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: formattedKey,
            },
            scopes: SCOPES,
        });

        const drive = google.drive({ version: 'v3', auth });

        console.log('--- Google Drive Upload Debug ---');
        console.log('Client Email:', clientEmail);
        console.log('Target Folder ID:', targetFolderId);
        console.log('File Name:', file.name);
        console.log('---------------------------------');

        // Convert File to Buffer/Stream
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const response = await drive.files.create({
            requestBody: {
                name: file.name,
                parents: [targetFolderId],
                mimeType: file.type,
            },
            media: {
                mimeType: file.type,
                body: stream,
            },
            fields: 'id, name, webViewLink, webContentLink, thumbnailLink',
            supportsAllDrives: true, // Crucial for Shared Drives
        });

        if (response.data.id) {
            await drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
        }

        return {
            fileId: response.data.id!,
            name: response.data.name!,
            url: response.data.webViewLink!,
            downloadUrl: response.data.webContentLink,
            thumbnail: response.data.thumbnailLink,
            mimeType: file.type
        };
    } catch (error: any) {
        console.error('Google Drive Upload Error Details:', JSON.stringify(error, null, 2));

        // Handle specific storage quota error
        if (error.code === 403 && error.message.includes('Service Accounts do not have storage quota')) {
            return {
                error: "Permission Error: Service Account has no storage. Please SHARE the target folder with the Service Account email (Editor role)."
            };
        }

        return { error: error.message || 'Unknown upload error' };
    }
}
