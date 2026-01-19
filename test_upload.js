const { google } = require('googleapis');
const { Readable } = require('stream');

async function testUpload() {
    try {
        const clientEmail = 'app-uploader@vianninhtoquoc-482816.iam.gserviceaccount.com';
        const folderId = '1jqdDUujfJHgZI3ekAPZ972mkFpmGNzDo';
        const privateKeyRaw = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCgoIeMeKIlQI5o
M6SB8fseMZJG6d/tk+BqAPu0qqjTJ0RO5bCIZ9d4I9LYgxxdYjb4wpMnODbc4CU1
YGJx/yEAwK/Tx+YOdLopi/1o3GM8rlMlYWwYPmz4/ZAmnM+qm4y0juF3DiqvUK79
VDeRk7kOfmf00Iz52w1g6WFRMxMaqUWBEvIOo9usqOHBHf7xRt09rOXVenBFw2Xl
ouhgTkHXT+InYng8H+DXxa7ZEb3EuiKmeDhf5025ZAv/rHI8wE+dqnNLkRHMtATq
Il+D8fjUZD7/D0oHNzUv1Qh8hsuS0YgSZ0AhqkbjlsiwKivVJDujx0NspvzNhA4V
U1kmxKOZAgMBAAECggEACE+F89yh9wkNO5LzpgC3gp5p+EVNeRgd+lFGtKUUl9tm
PpBfvw79KCtVhpVyBQ4Tbgqswzcc9fY0g27gAqno/5/FX4QhZ3B4P7VAgHADdzZF
xjjxXZrzpGy25c7wAUTyO/CDwqP3AJvm3rCNMRKfKbYC+h9E/zOenS8Czy+A6e+9
cBugHqM1ICDjBTkxyouifsNYra7NiHK1J4W1YsaDPy+vAcum6nVNdJ6XkZUM2dKt
5EZQ6XbdmZAofpnRyqY4tIky1gHPFeYd2hXYJ+qY1rFW30T5gO586+eh3IWmRdUa
e2YtEyRwQMM0d0IJUQ57mzDUr6RwqNKinowGWMaaKQKBgQDfHI8EseTtQXuzKns9
Y7FHAP3l8WVTuW6EBbQvbWY31n+fx8VB1XkgCyG0q/KWLoIHY3fulL2zlZNkmxKE
zs/5bgdsqN8b0eux6q7PcwcUTHiP+19QJDsQ5UrHqxvzo991Dn1W/POxkhZt/2yt
Rq9Vf9SkzOaIj5Xn49zkWjT+VwKBgQC4Tgbx7sfEdiNPhxEeWFsiB7IXhQ3VD/uN
a4Jb5fVisPTgYrw745HU244wdihNc4Z+0UEwDNUsySzB8Ply2FSGx7Kn/YQvzaJh
5q5Aif2HcyFKSKTlHdgYRboL1jIRrvhU/j835PgKbnFvAoMqjMfWOETkWU1fKHON
PBrLSj1XjwKBgHmLvmJJY7TZIsGlmAQGppJO+QLm8lOdRpbH4LShvbkXsulh1JWb
7WPGjLM3pW2poo7R4oloILyP9P8u9/TAEk8JYSQSD5HBV8zSVC+Rs76cNmYCBJfN
VRxMPePu1Mhzcw37Oc9E+KG5O1zrdNIlGunSPQ8WzVSCHKF64mDIv+v7AoGAeu8A
zusYsMCkOO28y2LgFsjPT8TePxnUDraBU08F6HhkPi9dowzePv7bzxNhOpguQ/TL
6IMGxkLB6fMUUDhf2S7mygrd2wzsnSTDYiUoyOpQcD4YTwMjGr2XpUGQUB9HYVnd
TSkbEcotO4CPgRg6S3do7G9snmZa/P/0V1kDpZ0CgYEAjjbYgOd0zVKNZ8ZmNGI5
EAo5qhORAkrmh0pBNk2s4s4qhizaWDunf4/6LNB6i5eb3j7jpoAIT7+OhcjYqqE8
bFgPuOmvVdvXQQX7Oj+unO+GKn0ZuM7N68CETAErl2d8luXVXBCDJkgpNy+n8o8E
mUHupeNI0vuSJcyupS1NVDw=
-----END PRIVATE KEY-----`;

        const privateKey = privateKeyRaw.replace(/\r\n/g, '\n');

        console.log('Testing upload with:');
        console.log('Email:', clientEmail);
        console.log('Folder:', folderId);

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const content = 'Hello World Test ' + new Date().toISOString();
        const stream = new Readable();
        stream.push(content);
        stream.push(null);

        console.log('Attempting upload...');
        const response = await drive.files.create({
            requestBody: {
                name: 'test_upload_debug_manual.txt',
                parents: [folderId],
                mimeType: 'text/plain',
            },
            media: {
                mimeType: 'text/plain',
                body: stream,
            },
            fields: 'id, name',
        });

        console.log('Upload success!', response.data);

    } catch (error) {
        console.error('Upload Failed!');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        // console.error(error);
    }
}

testUpload();
