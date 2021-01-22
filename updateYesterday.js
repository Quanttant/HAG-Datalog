const axios = require("axios");
const moment = require("moment-timezone");
const { JSDOM } = require("jsdom");
const { Octokit } = require("@octokit/core");
moment.updateLocale("en");
moment.locale("en");

const octokit = new Octokit({
    auth: process.env.MY_GITHUB_API_TOKEN,
});

const headerOptions = {
    headers: {
        accept: "application/json",
    },
};

const govOptions = {
    method: "GET",
    headers: {
        "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:84.0) Gecko/20100101 Firefox/84.0",
    },
    url: "https://covid19asi.saglik.gov.tr/",
};

const SYSREGEX = /Sys.*/gm;
const JQREGEX = /<script(\s)*>[\s\S]*?<\/script>/gim;

async function update() {
    const page = await axios(govOptions);
    let body = page.data;
    body = body.replace(SYSREGEX, "");
    body = body.replace(JQREGEX, (match) => {
        if (String(match).includes("$")) return " ";
        else return String(match);
    });
    const dom = new JSDOM(body, { runScripts: "dangerously" });
    const d = moment().format();

    let logResp = await axios.get(
        "https://raw.githubusercontent.com/Quanttant/HAG-Datalog/main/log.json",
        headerOptions
    );

    if (logResp.status != 200) throw "log.json alinamadi";

    let midnight = new Date();

    midnight.setHours(21, 0, 0, 0);

    const entries = Object.entries(logResp.data).map((x) => ({
        date: new Date(x[0]),
        count: x[1],
    }));

    const entriesOfYesterday = entries.filter((x) => x.date < midnight);

    const lastEntryOfYesterday =
        entriesOfYesterday[entriesOfYesterday.length - 1];

    let resp = await axios.get(
        "https://raw.githubusercontent.com/Quanttant/HAG-Datalog/main/stats.json",
        headerOptions
    );
    if (resp.status != 200) throw "stats.json alinamadi";

    let data = resp.data;

    data.total = dom.window.asiyapilankisisayisi;
    data.yesterday = parseInt(lastEntryOfYesterday.count);

    const shaResponse = await axios.get(
        "https://api.github.com/repos/Quanttant/HAG-Datalog/contents/stats.json",
        headerOptions
    );
    if (shaResponse.status != 200) throw "SHA blob alinamadi";

    const sha = shaResponse.data.sha;
    const updatedData = Buffer.from(JSON.stringify(data)).toString("base64");

    octokit
        .request("PUT /repos/{owner}/{repo}/contents/{path}", {
            accept: "application/vnd.github.v3+json",
            owner: "Quanttant",
            repo: "HAG-Datalog",
            path: "stats.json",
            message: `Yesterday and total stats updated @ ${d}`,
            content: updatedData,
            sha: sha,
        })
        .then((resp) => {
            console.log(resp);
        })
        .catch((e) => {
            console.log(e);
        });
}

update();
