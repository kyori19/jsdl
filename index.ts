import { send } from './lib/discord.js';
import download from './lib/download.js';
import { fetchLatestId, upload } from './lib/drive.js';
import { earlyReturn } from "./lib/errors.js";
import { fetchItem, login } from './lib/joysound.js';

const info = (message) => {
    void send(message);
};
const notify = (message) => {
    void send(message, true);
};
const error = notify;

let jar;
let latestId;

const process = () => {
    info(`Processing @ ${(new Date()).toISOString()}`);
    return fetchItem()
        .then((item) => {
            if (latestId === item.id) {
                info('Skipping due to no updates');
                throw earlyReturn;
            }
            return fetchLatestId()
                .then((id) => {
                    if (id === item.id) {
                        info('Skipping due to already exists');
                        throw earlyReturn;
                    }
                    return item;
                });
        })
        .then(async (data) => [
            data.id,
            await download(data, jar)
                .catch((err) => {
                    info(`Retrying error: ${err.message}`);
                    return login()
                        .then((newJar) => {
                            jar = newJar;
                            return download(data, jar);
                        });
                }),
        ])
        .then(([id, tmp]) => upload(id, tmp))
        .then((id) => {
            notify(`Uploaded ${id}`);
            latestId = id;
        })
        .catch((err) => {
            if (err === earlyReturn) {
                return;
            }
            error(`Unrecoverable error: ${err.message}`);
        });
};

await process();
setInterval(process, 4 * 60 * 1000);
