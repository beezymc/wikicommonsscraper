const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const readline = require('readline');

async function download(url, i) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const fileType = url.substr(url.length - 3);
    let fileName = '';
    if (fileType == "svg") {
        fileName = `./FIG_${i}.${fileType}`;
    } else {
        fileName = `./FIG_${i}.${fileType}`;
    }
    fs.writeFile(fileName, buffer, () => console.log('finished downloading!'));
}

async function fetchHtml (url) {
    const res = await fetch(url);
    const html = await res.text(); 
    return cheerio.load(html);
}

const run = async () => {
    const fileStream = fs.createReadStream('wikiCommonsURLs.txt');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    let i = 1;
    for await (const url of rl) {
        if (url.includes("upload.wikimedia.org/wikipedia/commons") && url.substr(url.length - 3) == "svg") {
            await download(url, i);
            const modURL = "https://commons.wikimedia.org/wiki/File:" + url.substr(url.lastIndexOf("/") + 1);
            const $ = await fetchHtml(modURL);
            const link = $('.mw-filepage-other-resolutions > a').attr('href');
            const pngLink = link.replace(link.substr((link.lastIndexOf("/") + 1), 3), '2000');
            await download(pngLink, i);
            i++;
        } else if (url.includes("commons.wikimedia.org/wiki/File:") && url.substr(url.length - 3) == "svg") {
            const $ = await fetchHtml(url);
            const svgLink = $('.fullMedia > p > a').attr('href');      
            await download(svgLink, i);
            const link = $('.mw-filepage-other-resolutions > a').attr('href');
            const pngLink = link.replace(link.substr((link.lastIndexOf("/") + 1), 3), '2000');
            await download(pngLink, i);
            i++;
        } else if (url.includes("upload.wikimedia.org/wikipedia/commons")) {
            await download(url, i);
            i++;
        } else if (url.includes("commons.wikimedia.org/wiki/File:")) {
            const $ = await fetchHtml(url);
            const link = $('.internal').attr('href');
            await download(link, i);
            i++;
        } else {
            console.log("Invalid Link! Please provide a valid wikicommons link.", url);
        }
    }
}

run();