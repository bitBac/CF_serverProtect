const axios = require('axios');
const osu = require('node-os-utils');

const ruleLimitID = '*';
const zoneID = '*';
const filterID = '*';
const cpuLimit = 80; //in %
//disable CF FW
const config = {
    headers: {
        "X-Auth-Email": "*",
        "X-Auth-Key": "*", //Global API Key
        "Content-Type": "application/json"
    }
};
let ruleIsEnabled = false;

let dataRule = {   //to get this data you need to send GET request on url from axios function
    "id": ruleLimitID,
    "paused": true,
    "description": "ProtectWithCatcha",
    "action": "challenge",
    "priority": null,
    "filter": {
        "id": filterID,
        "expression": "(not http.request.uri.path contains \"/payment\" and not http.request.uri.path contains \"/auth-chat-user\" and not http.request.uri.path contains \"/api/update-online\")",
        "paused": false,
        "description": "Shield all pages"
    }
};

/*
//Get all FW rules(to get rule ID and filter ID by ZoneID)
axios.get('https://api.cloudflare.com/client/v4/zones/'+zoneID+'/firewall/rules' , config).then((response) => {
    console.log(JSON.stringify(response.data));
}).catch(err => {
    console.log(err.response.data)
});*/

axios.put('https://api.cloudflare.com/client/v4/zones/'+zoneID+'/firewall/rules/' + ruleLimitID, dataRule, config).then((response) => {
console.log(response.data);
}).catch(err => {
    console.log(err.response.data)
});


let prevLoad = 0;
let rate = 1;
setInterval(() => {
    osu.cpu.usage()
        .then(info => {
            console.log('cpu loading - '+((prevLoad + info)/2) + " - "+new Date().toGMTString());
            if((prevLoad + info)/2 > cpuLimit && !ruleIsEnabled){
                console.log('High Load! Enable CF Rate Limit Rule - '+((prevLoad + info)/2) + " - "+new Date().toGMTString());
                rate = 4;
                dataRule.paused = false;
                axios.put('https://api.cloudflare.com/client/v4/zones/'+zoneID+'/firewall/rules/' + ruleLimitID, dataRule, config).then((response) => {
                    //console.log(response.data);
                    ruleIsEnabled = true;
                }).catch(err => {
                    console.log(err)
                });
            }
            prevLoad = info;
        });

}, 2200 * rate);//check cpu every 2 seconds, if the rule was enabled do checking every 10sec.

setInterval(() => {
    osu.cpu.usage()
        .then(info => {
            console.log(ruleIsEnabled+' DISABLE TRY - '+((prevLoad + info)/2) + " - "+new Date().toGMTString());
            if(ruleIsEnabled && (prevLoad + info)/2 < 40){
                console.log('DISABLE TRY STEP 2');
                ruleIsEnabled = false;
                dataRule.paused = true;
                rate = 1;
                axios.put('https://api.cloudflare.com/client/v4/zones/'+zoneID+'/firewall/rules/' + ruleLimitID, dataRule, config).then((response) => {

                }).catch(err => {
                    console.log(err)
                });
            }
            prevLoad = info;
        });

}, 1000 * 60 * 5);//check loading every 5 minutes and disable rule if loading is low
