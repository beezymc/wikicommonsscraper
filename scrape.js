const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const readline = require('readline');

//This function downloads the given file with a filename according to the figure number and filetype
async function download(url, i) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const fileType = url.substr(url.length - 3);
    let fileName = `./FIG_${i}.${fileType}`;
    fs.writeFile(fileName, buffer, () => console.log('finished downloading!'));
}

//This function fetches the html from the given url and parses it using cheerio.
async function fetchHtml (url) {
    const res = await fetch(url);
    const html = await res.text(); 
    return cheerio.load(html);
}

const run = async () => {
    //Reads URLs from a txt file saved alongside the .js file.
    const fileStream = fs.createReadStream('wikiCommonsURLs.txt');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    //'i' stores the numbering of the image files.
    let i = 1;
    for await (const url of rl) {
        //This condition checks if the URL starts with a certain string and ends with a particular filetype
        if (url.includes("upload.wikimedia.org/wikipedia/commons") && url.substr(url.length - 3) == "svg") {
            //The svg is downloaded straight from the page.
            await download(url, i);
            //We create a new URL which links to the original image page.
            const modURL = "https://commons.wikimedia.org/wiki/File:" + url.substr(url.lastIndexOf("/") + 1);
            const $ = await fetchHtml(modURL);
            //The html containing the download link is determined and that download link is fetched.
            const link = $('.mw-filepage-other-resolutions > a').attr('href');
            //An updated link to the highest resolution png image is created using that download link, which is then downloaded.
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