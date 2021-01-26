const fs = require('fs')
const exec = require('child_process').execSync
const rp = require('request-promise')

const KEY = process.env.JD_COOKIE
const serverJ = process.env.PUSH_KEY

const fileArr = [
    {
        title: '京东快递',
        fileName: 'jd_kd',
        newFileName: 'jd_kd_new'
    },
    {
        title: '十元街',
        fileName: 'jd_syj',
        newFileName: 'jd_syj_new'
    },
    {
        title: '领京豆额外奖励',
        fileName: 'jd_bean_home',
        newFileName: 'jd_bean_home_new'
    },
    {
        title: '京东汽车',
        fileName: 'jd_car',
        newFileName: 'jd_car_new'
    },
    {
        title: 'crazyJoy任务',
        fileName: 'jd_crazy_joy',
        newFileName: 'jd_crazy_joy_new'
    },
    {
        title: '京喜签到',
        fileName: 'jx_sign',
        newFileName: 'jx_sign_new'
    }
]

async function changeFile(fileName, newFileName) {
    let content = await fs.readFileSync(`./${fileName}.js`, 'utf8')
    content = content.replace(/cookiesArr = \[\]/, `cookiesArr = ['${KEY}']`)
    await fs.writeFileSync(`./${newFileName}.js`, content, 'utf8')
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
    const fileNameArr = []
    const newFileNameArr = []

    for (let item of fileArr) {
        const { fileName, newFileName } = item
        fileNameArr.push(fileName)
        newFileNameArr.push(newFileName)
        await changeFile(fileName, newFileName)
        await exec(`node ${newFileName}.js >> ${fileName}Result.txt`)
    }

    if (serverJ) {
        let content = ''
        for (let item of fileArr) {
            const { fileName, title } = item
            const path = `./${fileName}Result.txt`
            if (fs.existsSync(path)) {
                content += title
                content += '\n'
                content += fs.readFileSync(path, 'utf8')
                content += '\n'
            }
        }

        await sendNotify('每日一次' + new Date().toLocaleDateString(), content)
    }

    for (let item of fileArr) {
        const { fileName, newFileName } = item
        await exec(`rm -rf ${fileName}Result.txt`)
        await exec(`rm -rf ${newFileName}.js`)
    }
}

start()
