/*
京喜签到
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京喜签到
5 0 * * * https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jx_sign.js, tag=京喜签到, enabled=true

================Loon==============
[Script]
cron "5 0 * * *" script-path=https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jx_sign.js,tag=京喜签到

===============Surge=================
京喜签到 = type=cron,cronexp="5 0 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jx_sign.js

============小火箭=========
京喜签到 = type=cron,script-path=https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jx_sign.js, cronexpr="5 0 * * *", timeout=200, enable=true
 */
const c =
    '__jda=122270672.1610427242830858768963.1610427242.1610427242.1610857361.2; __jdv=122270672%7Cdirect%7C-%7Cnone%7C-%7C1610427242830; mba_muid=1610427242830858768963; shshshfp=339bf37653b9bfffe2a96043dfdf50bf; shshshfpa=f538de18-c97d-3a82-f25f-b9ba984757b7-1610427243; shshshfpb=aGLXOose7rB7pPafqxMB%2FLw%3D%3D; TrackerID=VvZWFDq2KIBZdRDF7HpdKr7qAxR3MhixTPPSElIbFiFqEwSKsZDcIP3eqTutSzhHA9WUTCMex0Plverp97fI8OCV3yiU1FxIGd7aDwg4OX2xKDf5HfOPQvzKo1yG316k-JNrT8veqs7Qlg-DllePRg; retina=0; cid=9; webp=1; visitkey=57084406012431593; __wga=1610857373702.1610857373702.1610427320235.1610427320235.1.2; sc_width=414; 3AB9D23F7A4B3C9B=2CO5EQAZN6WS5MWCJME3OLQ3CDDSNPW4LLSDMK3BTS3CFGZUWOUWUOLE3AOOWGPHQ3YEW4SUDD27KR6UX6QNXJMEOU; pt_key=AAJf_TFBADDMpxCgxARDF8sSX8EadMujieU78liRgv09ZU9dpyFhuJoiotdTVfCL3I_ajij_Dt4; pt_pin=jd_4146f1bee2d3f; pt_token=ft3v71d1; pwdt_id=jd_4146f1bee2d3f; sfstoken=tk01m01d31e36a8sMiszKzFudk4rE3zpqIDjjdglHkGNuV1JCLcrDp3g4jsfpyLYCd5jpmkR4hovsuufUuGdE1zal40z; wxa_level=1; wqmnx1=MDEyNjM3MXRoam13YzU2NWwgdzBuNDRjMGk4MzJVQjJSSSopJQ%3D%3D; jxsid=16108573612397086443; __jdb=122270672.2.1610427242830858768963|2.1610857361; __jdc=122270672; mba_sid=16108573614994069752283369409.2; PPRD_P=UUID.1610427242830858768963; jxsid_s_t=1610857373741; jxsid_s_u=https%3A//home.m.jd.com/myJd/newhome.action; shshshsID=2fefa8cccdc83f0152a6c2f3dfd7a0c6_1_1610857374201'
const $ = new Env('京喜签到')

let jdNotify = true //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [c],
    cookie = '',
    message
let helpAuthor = true

const JD_API_HOST = 'https://m.jingxi.com/'
!(async () => {
    if (!cookiesArr[0]) {
        $.msg(
            $.name,
            '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取',
            'https://bean.m.jd.com/bean/signIndex.action',
            { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' }
        )
        return
    }
    $.newShareCodes = []
    // await getAuthorShareCode();
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i]
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
            $.index = i + 1
            $.isLogin = true
            $.nickName = ''
            message = ''
            await TotalBean()
            console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`)
            if (!$.isLogin) {
                $.log(
                    $.name,
                    `【提示】cookie已失效`,
                    `京东账号${$.index} ${
                        $.nickName || $.UserName
                    }\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`,
                    { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' }
                )

                continue
            }
            await jdCash()
        }
    }
})()
    .catch(e => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done()
    })
async function jdCash() {
    $.coins = 0
    $.money = 0
    await sign()
    await getTaskList()
    await doubleSign()
    await showMsg()
}
function sign() {
    return new Promise(resolve => {
        $.get(taskUrl('pgcenter/sign/UserSignOpr'), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data)
                        if (data.retCode === 0) {
                            if (data.data.signStatus === 0) {
                                console.log(`签到成功，获得${data.data.pingoujin}金币，已签到${data.data.signDays}天`)
                                $.coins += parseInt(data.data.pingoujin)
                            } else {
                                console.log(`今日已签到`)
                            }
                        } else {
                            console.log(`签到失败，错误信息${data.errMsg}`)
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
function getTaskList() {
    return new Promise(resolve => {
        $.get(taskUrl('pgcenter/task/QueryPgTaskCfgByType', 'taskType=3'), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data)
                        if (data.retCode === 0) {
                            for (task of data.data.tasks) {
                                if (task.taskState === 1) {
                                    console.log(`去做${task.taskName}任务`)
                                    await doTask(task.taskId)
                                    await $.wait(1000)
                                    await finishTask(task.taskId)
                                    await $.wait(1000)
                                }
                            }
                        } else {
                            console.log(`签到失败，错误信息${data.errMsg}`)
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
function doTask(id) {
    return new Promise(resolve => {
        $.get(taskUrl('pgcenter/task/drawUserTask', `taskid=${id}`), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data)
                        if (data.retCode === 0) {
                            console.log(`任务领取成功`)
                        } else {
                            console.log(`任务完成失败，错误信息${data.errMsg}`)
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
function finishTask(id) {
    return new Promise(resolve => {
        $.get(taskUrl('pgcenter/task/UserTaskFinish', `taskid=${id}`), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data)
                        if (data.retCode === 0) {
                            console.log(`任务完成成功，获得金币${data.datas[0]['pingouJin']}`)
                            $.coins += data.datas[0]['pingouJin']
                        } else {
                            console.log(`任务完成失败，错误信息${data.errMsg}`)
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
function doubleSign() {
    return new Promise(resolve => {
        $.get(taskUrl('double_sign/IssueReward'), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data)
                        if (data.retCode === 0) {
                            console.log(`双签成功，获得金币${data.data.jd_amount / 100}元`)
                            $.money += data.data.jd_amount / 100
                        } else {
                            console.log(`任务完成失败，错误信息${data.errMsg}`)
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
function showMsg() {
    message += `本次运行获得金币${$.coins},现金${$.money}`
    return new Promise(resolve => {
        if (!jdNotify) {
            $.msg($.name, '', `${message}`)
        } else {
            $.log(`京东账号${$.index}${$.nickName}\n${message}`)
        }
        resolve()
    })
}

function taskUrl(functionId, body = '') {
    return {
        url: `${JD_API_HOST}${functionId}?sceneval=2&g_login_type=1&g_ty=ls&${body}`,
        headers: {
            Cookie: cookie,
            Host: 'm.jingxi.com',
            Connection: 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: 'https://jddx.jd.com/m/jddnew/money/index.html',
            'User-Agent': $.isNode()
                ? process.env.JD_USER_AGENT
                    ? process.env.JD_USER_AGENT
                    : require('./USER_AGENTS').USER_AGENT
                : $.getdata('JDUA')
                ? $.getdata('JDUA')
                : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
            'Accept-Language': 'zh-cn',
            'Accept-Encoding': 'gzip, deflate, br'
        }
    }
}

function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            headers: {
                Accept: 'application/json,text/plain, */*',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'zh-cn',
                Connection: 'keep-alive',
                Cookie: cookie,
                Referer: 'https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2',
                'User-Agent': $.isNode()
                    ? process.env.JD_USER_AGENT
                        ? process.env.JD_USER_AGENT
                        : require('./USER_AGENTS').USER_AGENT
                    : $.getdata('JDUA')
                    ? $.getdata('JDUA')
                    : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0'
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data)
                        if (data['retcode'] === 13) {
                            $.isLogin = false //cookie过期
                            return
                        }
                        $.nickName = data['base'].nickname
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve()
            }
        })
    })
}
function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == 'object') {
            return true
        }
    } catch (e) {
        console.log(e)
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`)
        return false
    }
}
function jsonParse(str) {
    if (typeof str == 'string') {
        try {
            return JSON.parse(str)
        } catch (e) {
            console.log(e)
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return []
        }
    }
}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}