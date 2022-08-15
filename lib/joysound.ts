import CryptoJS from 'crypto-js';
import { XMLParser } from 'fast-xml-parser';
import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';

export const login = () => fetch('https://www.joysound.com/utasuki/login.htm', {
    method: 'POST',
    body: (() => {
        const d = new URLSearchParams();
        d.set('loginId', process.env.LOGIN_ID);
        d.set('password', process.env.PASSWORD);
        d.set('autoLogin', 'true');
        return d;
    })(),
    redirect: 'manual',
})
    .then(async (res) => {
        const jar = new CookieJar();
        await Promise.all(
            res.headers.raw()['set-cookie'].map((cookie) => jar.setCookie(cookie, res.url)),
        );
        return jar;
    });

type AnalystResult = {
    analysisId: string,
    artistName: string,
    selSongName: string,
    playDate: number,
};

const listUrl = 'https://www.joysound.com/api/1.0/member/@me/score/analyses?startIndex=0&count=1&maxPageNum=1';
export const fetchItem = async (jar: CookieJar) => fetch(listUrl, {
    headers: {
        'Cookie': await jar.getCookieString(listUrl),
        'X-JSP-APP-NAME': 'www.joysound.com',
    },
})
    .then((res) => {
        if (!res.ok) {
            throw Error(`Fetch failed with ${res.status}`);
        }
        return res.json() as Promise<{ analystScoreResults: AnalystResult[] }>;
    })
    .then(({ analystScoreResults: [first] }) => first);

type XMLData = {
    asdata: {
        '@_songname': string;
        '@_snname': string;
        '@_total': string;
        '@_theme': string;
        '@_stable': string;
        '@_longtone': string;
        '@_yokuyo': string;
        '@_technick3': string;
    };
};

const dataUrl = 'https://pd.joysound.com/ass/data';
export const fetchData = async (id: string, timestamp: number, jar: CookieJar) => fetch(dataUrl, {
    method: 'POST',
    headers: {
        'Cookie': await jar.getCookieString(dataUrl),
    },
    body: (() => {
        const d = new URLSearchParams();
        d.set('asid', id);
        d.set('fps', '8');
        return d;
    })(),
})
    .then((res) => res.arrayBuffer())
    .then((arr) => Buffer.from(arr).toString('base64'))
    .then(async (str) => {
        const sessionId = await jar.getCookies(dataUrl)
            .then((cookies) => cookies.find(({ key }) => key === '_JSPSID').value);
        return CryptoJS.AES.decrypt(str, CryptoJS.MD5(sessionId), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
        })
            .toString(CryptoJS.enc.Utf8);
    })
    .then((xml) => {
        const parser = new XMLParser({ ignoreAttributes: false });
        return (parser.parse(xml) as XMLData).asdata;
    })
    .then((data) => ({
        title: `${data['@_songname']}／${data['@_snname']}`,
        name: data['@_songname'],
        artist: data['@_snname'],
        total: Number.parseFloat(data['@_total']),
        theme: Number.parseFloat(data['@_theme']),
        stable: Number.parseFloat(data['@_stable']),
        longtone: Number.parseFloat(data['@_longtone']),
        yokuyo: Number.parseFloat(data['@_yokuyo']),
        technique: Number.parseFloat(data['@_technick3']),
        timestamp: timestamp,
        date: (new Date(timestamp)).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: undefined,
            timeZone: 'Asia/Tokyo',
        }),
    }));

const audioUrl = 'https://pd.joysound.com/ass/audio';
export const fetchAudio = async (id: string, jar: CookieJar) => fetch(`${audioUrl}?asid=${id}&fmt=m4a`, {
    headers: {
        'Cookie': await jar.getCookieString(audioUrl),
    },
})
    .then((res) => res.body);
