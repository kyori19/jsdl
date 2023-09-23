import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import { path } from 'temp';
import { CookieJar } from 'tough-cookie';

import { fetchAudio } from './joysound.js';

// noinspection JSUnusedLocalSymbols
interface PromiseConstructor {
    all<T extends readonly unknown[]>(values: T): Promise<{ [K in keyof T]: Awaited<T[K]> }>;
}

export default ({ id, ...data }: { id: string, title: string }, jar: CookieJar) =>
    fetchAudio(id, jar)
        .then((audio) =>
            new Promise<string>((resolve, reject) => {
                const tmp = path({ suffix: '.m4a' });
                ffmpeg(Readable.from(audio))
                    .output(tmp)
                    .outputOptions(
                        '-metadata', `title=${id} ${data.title}`,
                        '-metadata', 'artist=joysound',
                        '-metadata', 'album=joysound (main)',
                        '-metadata', 'album_artist=joysound',
                        '-metadata', 'disc=1',
                        '-metadata', 'genre=karaoke',
                        '-metadata', `lyrics=${JSON.stringify(data)}`,
                    )
                    .on('end', () => resolve(tmp))
                    .on('error', (err) => reject(err))
                    .run();
            }));
