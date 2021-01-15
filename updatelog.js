const axios = require("axios");

const headerOptions = {
    headers: {
        accept: "application/json",
    },
};

module.exports = async function updateLog(dom, octokit, d) {
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

    octokit
        .request("PUT /repos/{owner}/{repo}/contents/{path}", {
            accept: "application/vnd.github.v3+json",
            owner: "Quanttant",
            repo: "HAG-Datalog",
            path: "log.json",
            message: `Data updated @ ${d}`,
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