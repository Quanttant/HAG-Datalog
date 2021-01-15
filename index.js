const axios = require("axios");
const moment = require("moment-timezone");
const { JSDOM } = require("jsdom");
const { Octokit } = require("@octokit/core");

moment.updateLocale("tr");
moment.locale("tr");

const octokit = new Octokit({ auth: process.env.MY_GITHUB_API_TOKEN });
const octokit = new Octokit({ auth: TOKEN });
const URL = "https://covid19asi.saglik.gov.tr/";
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
    url: URL,
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
    const date = moment(new Date().getDate(), "DD.MM.YYYY").format(
        "DD/MM/YYYY"
    );
    const d = moment().format();

    let resp = await axios.get(
        "https://raw.githubusercontent.com/Quanttant/HAG-Datalog/main/log.json",
        headerOptions
    );

    if (resp.status != 200) throw "log.json alinamadi";
    let data = resp.data;
    data[d] = dom.window.asiyapilankisisayisi;

    const shaResponse = await axios.get(
        "https://api.github.com/repos/Quanttant/HAG-Datalog/contents/log.json",
        headerOptions
    );

    const sha = shaResponse.data.sha;
    const updatedData = Buffer.from(JSON.stringify(data)).toString("base64");

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
        accept: "application/vnd.github.v3+json",
        owner: "Quanttant",
        repo: "HAG-Datalog",
        path: "log.json",
        message: `Data updated @ ${d}`,
        content: updatedData,
        sha: sha,
    });
}

update();
