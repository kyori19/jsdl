import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import * as process from "process";

const LoginFailedError = new Error('Login failed');

type LoginResponse = {
    response: string;
    result: string;
}

export const login = () => fetch('https://navi-ss.joysound.com/Common/ComProxy', {
    method: 'POST',
    body: (() => {
        const d = new URLSearchParams();
        d.set('x-jsp-app-name', 'www.joysound.com');
        d.set('pf_api_nm', 'api/1.0/auth/session');
        d.set('api_ver', '1');
        d.set('loginId', process.env.LOGIN_ID);
        d.set('password', process.env.PASSWORD);
        d.set('autoLoginFlg', 'true');
        return d;
    })(),
    redirect: 'manual',
})
    .then(async (res) => {
        if ((await res.json() as LoginResponse).result !== '0') {
            throw LoginFailedError;
        }

        const jar = new CookieJar();
        await Promise.all(
            res.headers.raw()['set-cookie'].map((cookie) => jar.setCookie(cookie, res.url)),
        );
        return jar;
    });

type AnalystResult = {
    anlId: string,
    singerName: string,
    songName: string,
    playDate: string,
    info2: number,
    info5: number,
    info11: number,
    info18: number,
    info19: number,
    info24: number,
};

type AnalystScoreListResponse = {
    response: {
        analystScoreList: AnalystResult[];
    };
};

const listUrl = 'https://navi-ss.joysound.com/Common/Gene121Wrapping';
export const fetchItem = async () => fetch(listUrl, {
    method: 'POST',
    headers: {
        'X-APPID': '0000200',
        'X-APPVER': '1.0.0',
        'X-AUTHFLAG': '1',
        'X-OSNAME': 'iOS',
        'X-OSVER': '1.0.0',
        'X-JSID': process.env.LOGIN_ID,
        'X-PWD': process.env.PASSWORD,
        'X-UUID': '000001',
    },
    body: (() => {
        const d = new URLSearchParams();
        d.set('classpath', 'AnalystScore4Service');
        d.set('method', 'getAnalystScore4ResultList');
        d.set('type1', 'java.lang.String');
        d.set('value1', process.env.LOGIN_ID.toUpperCase());
        d.set('type2', 'java.lang.String');
        d.set('value2', 'null');
        d.set('type3', 'ot.model.definition.SortOrder');
        d.set('value3', 'null');
        d.set('type4', 'ot.model.Range');
        d.set('value4', JSON.stringify({ startRecord: 1, maxRecords: 1 }));
        d.set('api_ver', '1');
        return d;
    })(),
})
    .then((res) => {
        if (!res.ok) {
            throw Error(`Fetch failed with ${res.status}`);
        }
        return res.json() as Promise<AnalystScoreListResponse>;
    })
    .then(({ response: { analystScoreList: [first] } }) => first)
    .then((data) => ({
        id: data.anlId,
        artist: data.singerName,
        name: data.songName,
        timestamp: ((str) =>
            new Date(`${str.slice(0, 4)}/${str.slice(4, 6)}/${str.slice(6, 8)} ${str.slice(8, 10)}:${str.slice(10, 12)}:${str.slice(12, 14)}`))(data.playDate)
            .getTime(),
        total: data.info2,
        theme: data.info11,
        stable: data.info19,
        longtone: data.info18,
        yokuyo: data.info24,
        enthusiasm: (data.info5 - 5e4),
    }))
    .then((json) => ({
        ...json,
        title: `${json.name}／${json.artist}`,
        date: (new Date(json.timestamp)).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: undefined,
            timeZone: 'Asia/Tokyo',
        }),
        total: json.total / 1e3,
        theme: json.theme / 1e3,
        stable: json.stable / 1e3,
        longtone: json.longtone / 1e3,
        yokuyo: json.yokuyo / 1e3,
        technique: (json.total - (json.theme + json.stable + json.longtone + json.yokuyo + json.enthusiasm)) / 1e3,
        enthusiasm: json.enthusiasm / 1e3,
    }));

const audioUrl = 'https://pd.joysound.com/ass/audio';
export const fetchAudio = async (id: string, jar: CookieJar) => fetch(`${audioUrl}?asid=${id}&fmt=m4a`, {
    headers: {
        'Cookie': await jar.getCookieString(audioUrl),
    },
})
    .then((res) => res.body);
