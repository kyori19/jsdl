import { createReadStream } from 'fs';
import { rm } from 'fs/promises';
import { google } from 'googleapis';

const googleAuth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth: googleAuth });

export const fetchLatestId = () => drive.files.list({
    q: `'${process.env.DRIVE_FOLDER_ID}' in parents`,
    orderBy: 'name desc',
    pageSize: 1,
})
    .then(({ data: { files: [first] } }) => first.name.replace('.m4a', ''));

export const upload = (id: string, tmp: string) => drive.files.create({
    requestBody: {
        name: `${id}.m4a`,
        parents: [process.env.DRIVE_FOLDER_ID],
        mimeType: 'audio/mp4',
    },
    media: {
        mimeType: 'audio/mp4',
        body: createReadStream(tmp),
    },
})
    .then(async ({ data }) => {
        await rm(tmp);
        return data.name.replace('.m4a', '');
    });
