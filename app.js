const express = require('express');
const axios = require('axios');
const qs = require('qs');
require('dotenv').config();
require('./errorHandling');

const port = (process.env.PORT) ? process.env.PORT : 3000;
const app = express();
const REFRESH_TIME = (process.env.REFRESH_TIME) ? process.env.REFRESH_TIME : 10000;

let maytagAccessToken = "";
let maytagRefreshToken = "";
let maytagSAIDs = [];
let maytagStatuses = {
    washers: [],
    dryers: [],
    others: []
};

maytagAuthenticate().then(function(){
    getAllAppliancesStatuses(true);
});

app.get('/', (req, res) => {
    return res.send("Supported API Endpoints:<br/><ul><li>GET: <a href='/appliances/washers'><code>/appliances/washers</code></a></li><li>GET: <a href='/appliances/dryers'><code>/appliances/dryers</code></a></li></ul>")
});

app.get('/appliances/washers', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(maytagStatuses.washers, null, 2));
});

app.get('/appliances/dryers', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(maytagStatuses.dryers, null, 2));
});

async function maytagAuthenticate(refreshToken) {
    let expires = 0;
    if(refreshToken) {
        axios({
            method: 'post',
            url: 'https://api.whrcloud.com/oauth/token',
            data: qs.stringify({
                client_id: 'maytag_ios',
                client_secret: 'OfTy3A3rV4BHuhujkPThVDE9-SFgOymJyUrSbixjViATjCGviXucSKq2OxmPWm8DDj9D1IFno_mZezTYduP-Ig',
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then((result) => {
                console.log("Authenticated with Maytag using refresh token.  Token expires in ", expires, "seconds.");
                expires = result.data.expires_in;
                maytagAccessToken = result.data.access_token;
                maytagRefreshToken = result.data.refresh_token;
                maytagSAIDs = result.data.SAID;
            })
            .catch((err) => {
                console.log("Failed to authenticate with Maytag using refresh token.");
                // console.log(err);
            })
    } else {
        axios({
            method: 'post',
            url: 'https://api.whrcloud.com/oauth/token',
            data: qs.stringify({
                client_id: 'maytag_ios',
                client_secret: 'OfTy3A3rV4BHuhujkPThVDE9-SFgOymJyUrSbixjViATjCGviXucSKq2OxmPWm8DDj9D1IFno_mZezTYduP-Ig',
                grant_type: 'password',
                password: process.env.MAYTAG_PASSWORD,
                username: process.env.MAYTAG_ACCOUNT_NAME
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'okhttp/3.12.0',
            }
        })
        .then((result) => {
            console.log("Authenticated with Maytag using credentials.  Token expires in", expires, "seconds.");
            expires = result.data.expires_in;
            maytagAccessToken = result.data.access_token;
            maytagRefreshToken = result.data.refresh_token;
            maytagSAIDs = result.data.SAID;
            getAllAppliancesStatuses(false);
        })
        .catch((err) => {
            console.log("Failed to authenticate with Maytag using credentials.");
            // console.log(err);
        })
    }
    if(expires === 0) {
        expires = 21599;
    }
    setTimeout(function() {
        maytagAuthenticate(maytagRefreshToken);
    }, (expires * 1000))
}

async function getApplianceStatus(said) {
    return axios({
        method: 'get',
        url: 'https://api.whrcloud.com/api/v1/appliance/' + said,
        headers: {
            "Authorization": "Bearer " + maytagAccessToken,
            "Host": "api.whrcloud.com",
            "User-Agent": "okhttp/3.12.0",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache"
        }
    })
        .catch((err) => {
            console.log(err);
        });
}

function getAllAppliancesStatuses(recursive = false) {
    let output = {
        washers: [],
        dryers: [],
        other: []
    };
    for(let i = 0; i < maytagSAIDs.length; i++) {
        getApplianceStatus(maytagSAIDs[i]).then((data) => {
            if(data.data.attributes.WashCavity_CycleSetCycleSelect) {
                output.washers.push({
                    id: data.data.applianceId,
                    type: 'washer',
                    lastSynced: data.data.lastFullSyncTime,
                    lastModified: data.data.lastModified,
                    serialNumber: data.data.attributes.XCat_ApplianceInfoSetSerialNumber.value,
                    doorOpen: parseInt(data.data.attributes.Cavity_OpStatusDoorOpen.value),
                    doorLocked: parseInt(data.data.attributes.Cavity_OpStatusDoorLocked.value),
                    drawerOpen: parseInt(data.data.attributes.WashCavity_OpStatusDispenserDrawerOpen.value),
                    cycleId: parseInt(data.data.attributes.WashCavity_CycleSetCycleSelect.value),
                    cycleName: data.data.attributes.Cavity_CycleSetCycleName.value,
                    status: parseInt(data.data.attributes.Cavity_CycleStatusMachineState.value),
                    needsClean: parseInt(data.data.attributes.WashCavity_CycleStatusCleanReminder.value),
                    delayTime: data.data.attributes.Cavity_TimeSetDelayTime.value,
                    delayRemaining: parseInt(data.data.attributes.Cavity_TimeStatusDelayTimeRemaining.value),
                    rinsing: parseInt(data.data.attributes.WashCavity_CycleStatusRinsing.value),
                    draining: data.data.attributes.WashCavity_CycleStatusDraining.value,
                    filling: parseInt(data.data.attributes.WashCavity_CycleStatusFilling.value),
                    spinning: parseInt(data.data.attributes.WashCavity_CycleStatusSpinning.value),
                    soaking: data.data.attributes.WashCavity_CycleStatusSoaking.value,
                    sensing: parseInt(data.data.attributes.WashCavity_CycleStatusSensing.value),
                    washing: parseInt(data.data.attributes.WashCavity_CycleStatusWashing.value),
                    addGarmet: parseInt(data.data.attributes.WashCavity_CycleStatusAddGarment.value),
                    operations: parseInt(data.data.attributes.Cavity_OpSetOperations.value),
                    powerOnHours: parseInt(data.data.attributes.XCat_OdometerStatusTotalHours.value),
                    hoursInUse: parseInt(data.data.attributes.XCat_OdometerStatusRunningHours.value),
                    totalCycles: parseInt(data.data.attributes.XCat_OdometerStatusCycleCount.value),
                    remoteEnabled: parseInt(data.data.attributes.XCat_RemoteSetRemoteControlEnable.value),
                    temperature: parseInt(data.data.attributes.WashCavity_CycleSetTemperature.value),
                    spinSpeed: parseInt(data.data.attributes.WashCavity_CycleSetSpinSpeed.value),
                    soilLevel: parseInt(data.data.attributes.WashCavity_CycleSetSoilLevel.value),
                    timeRemaining: (parseInt(data.data.attributes.Cavity_TimeStatusEstTimeRemaining.value)/60),
                    online: parseInt(data.data.attributes.Online.value)
                });
                /***
                 * Status Values
                 *
                 * status: [0=off, 1=on but not running, 7=running, 6=paused, 10=cycle complete]
                 * cycleId: [5 = delicates]
                 * temperature: [5 = tap cold]
                 * spinSpeed: [3 = medium]
                 * soilLevel: [0 = light]
                 */
            } else if(data.data.attributes.DryCavity_CycleSetCycleSelect) {
                output.dryers.push({
                    id: data.data.applianceId,
                    type: 'dryer',
                    lastSynced: data.data.lastFullSyncTime,
                    lastModified: data.data.lastModified,
                    serialNumber: data.data.attributes.XCat_ApplianceInfoSetSerialNumber.value,
                    doorOpen: parseInt(data.data.attributes.Cavity_OpStatusDoorOpen.value),
                    status: parseInt(data.data.attributes.Cavity_CycleStatusMachineState.value),
                    cycleName: data.data.attributes.Cavity_CycleSetCycleName.value,
                    cycleId: parseInt(data.data.attributes.DryCavity_CycleSetCycleSelect.value),
                    manualDryTime: parseInt(data.data.attributes.DryCavity_CycleSetManualDryTime.value),
                    drynessLevel: parseInt(data.data.attributes.DryCavity_CycleSetDryness.value),
                    airflow: parseInt(data.data.attributes.DryCavity_CycleStatusAirFlowStatus.value),
                    drying: parseInt(data.data.attributes.DryCavity_CycleStatusDrying.value),
                    damp: parseInt(data.data.attributes.DryCavity_CycleStatusDamp.value),
                    steaming: parseInt(data.data.attributes.DryCavity_CycleStatusSteaming.value),
                    sensing: parseInt(data.data.attributes.DryCavity_CycleStatusSensing.value),
                    cooldown: parseInt(data.data.attributes.DryCavity_CycleStatusCoolDown.value),
                    temperature: parseInt(data.data.attributes.DryCavity_CycleSetTemperature.value),
                    operations: parseInt(data.data.attributes.Cavity_OpSetOperations.value),
                    powerOnHours: parseInt(data.data.attributes.XCat_OdometerStatusTotalHours.value),
                    hoursInUse: parseInt(data.data.attributes.XCat_OdometerStatusRunningHours.value),
                    totalCycles: parseInt(data.data.attributes.XCat_OdometerStatusCycleCount.value),
                    remoteEnabled: parseInt(data.data.attributes.XCat_RemoteSetRemoteControlEnable.value),
                    timeRemaining: (parseInt(data.data.attributes.Cavity_TimeStatusEstTimeRemaining.value)/60),
                    online: parseInt(data.data.attributes.Online.value)
                });
                /***
                 * Status Values
                 *
                 * status: [0=off, 1=on but not running, 7=running, 6=paused, 10=cycle complete]
                 */
            } else {
                output.other.push({
                    id: data.data.applianceId,
                    type: 'unknown',
                    lastSynced: data.data.lastFullSyncTime,
                    lastModified: data.data.lastModified,
                    serialNumber: data.data.attributes.XCat_ApplianceInfoSetSerialNumber.value,
                    online: data.data.attributes.Online.value
                });
            }
        })
            .then(() => {
                if(i === maytagSAIDs.length - 1) {
                    if(output.dryers.length > 0 && output.washers.length > 0) {
                        maytagStatuses = output;
                    } else if(output.dryers.length > 0) {
                        maytagStatuses.dryers = output.dryers;
                    } else if(output.washers.length > 0) {
                        maytagStatuses.washers = output.washers;
                    }
                }
            });
    }

    if(recursive) {
        let checkDelay = (Math.floor((Math.random() * 1000) + REFRESH_TIME));

        setTimeout(function() {
            getAllAppliancesStatuses(true, checkDelay);
        }, checkDelay);
    }
}

app.set('json spaces', 2);
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));