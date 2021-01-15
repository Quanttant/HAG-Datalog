const axios = require("axios");

const headerOptions = {
    headers: {
        accept: "application/json",
    },
};

module.exports = async function updateStats(dom, octokit, d) {
    let resp = await axios.get(
        "https://raw.githubusercontent.com/Quanttant/HAG-Datalog/main/stats.json",
        headerOptions
    );
    if (resp.status != 200) throw "stats.json alinamadi";

    let data = resp.data;
    data.total = dom.window.asiyapilankisisayisi;

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
            message: `Stats updated @ ${d}`,
            content: updatedData,
            sha: sha,
        })
        .then((resp) => {
            console.log(resp);
        })
        .catch((e) => {
            console.log(e);
        });
};