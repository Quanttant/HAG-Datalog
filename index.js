const axios = require("axios");
const moment = require("moment-timezone");
const { JSDOM } = require("jsdom");
const { Octokit } = require("@octokit/core");
const updateLog = require("./updatelog");
const updateStats = require("./updatestats");

moment.updateLocale("tr");
moment.locale("tr");

const octokit = new Octokit({ auth: process.env.MY_GITHUB_API_TOKEN });

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

    // update log
    updateLog(dom, octokit, d);
    setTimeout(() => {
        updateStats(dom, octokit, d);
    }, 5000);
    // update stats
}

update();
