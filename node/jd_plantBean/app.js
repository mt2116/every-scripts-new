const fs = require('fs')
const exec = require('child_process').execSync
const rp = require('request-promise')

const KEY = process.env.JD_COOKIE
const serverJ = process.env.PUSH_KEY

async function changeFile() {
    let content = await fs.readFileSync('./jd_plantBean.js', 'utf8')
    content = content.replace(/cookiesArr = \[\]/, `cookiesArr = ['${KEY}']`)
//     content = content.replace(
//         /let shareCodes = \[[\s\S]*let currentRoundId = null/,
//         `let shareCodes = [];\nlet currentRoundId = null`
//     )
    content = content.replace(/await\srequireConfig\(\);/, '//await requireConfig();')
    await fs.writeFileSync('./jd_plantBean_new.js', content, 'utf8')
}

async function sendNotify(text, desp) {
    const options = {
        uri: `https://sc.ftqq.com/${serverJ}.send`,
        form: { text, desp },
        json: true,
        method: 'POST'
    }
    await rp
        .post(options)
        .then(res => {
            console.log(res)
        })
        .catch(err => {
            console.log(err)
        })
}

async function start() {
    await changeFile()
    await exec('node jd_plantBean_new.js >> result.txt')

    if (serverJ) {
        const path = './result.txt'
        let content = ''
        if (fs.existsSync(path)) {
            content = fs.readFileSync(path, 'utf8')
        }

        await sendNotify('种豆得豆' + new Date().toLocaleDateString(), content)
    }
    
    await exec('rm -rf jd_plantBean_new.js')
}

start()

