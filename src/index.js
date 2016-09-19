'use strict'

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController;
let TelegramBotToken = null;
if(!TelegramBotToken){
    if(process.argv[2]){
        TelegramBotToken = process.argv[2];
    } else {
        console.log("No TelegramBot Token specified.");
        process.exit(1);
    }
}
const tg = new Telegram.Telegram(TelegramBotToken);

const ip = require('ip');
const publicIp = require('public-ip');


const userData = function(user){
    return user._firstName + " " + user._lastName + "(" + user._id + ")"
}

const helpText = "" +
    "Help Menu - Commands:\n" +
    "/ip : get current local ip address\n" +
    "/wan : get current wan ip address\n" +
    "/hack : experimental stuff\n" +
    "/remind type value message\n" +
    "    type    = hour, min or date\n" +
    "    value   = the time value, or Date as: 'DD.MM.YYYY hh:mm'\n" +
    "    message = The reminder message you will get";

class StartController extends TelegramBaseController {
    handle($){
        let cmd = $._update._message._text;
        let user = $._update._message._from;
        let debugName = "[otherwise]";
        console.log(debugName + "Request from " + userData(user));

        $.sendMessage("Welcome " + user._firstName + "\n\n" + helpText);
    }
}
class OtherwiseController extends TelegramBaseController {
    handle($){
        let cmd = $._update._message._text;
        let user = $._update._message._from;
        let debugName = "[otherwise]";
        console.log(debugName + "unknown command: '" + cmd + "' from " + userData(user));

        $.sendMessage("unknown command: " + cmd + "\n\n" + helpText);
    }
}

class IPController extends TelegramBaseController {
    ipHandler($){
        let user = $._update._message._from;
        let debugName = "[/ip]";
        console.log(debugName + "Request from " + userData(user));

        $.sendMessage('Local IP: ' + ip.address());
    };

    get routes(){
        return {
            '/ip': 'ipHandler'
        }
    };
}
class WanController extends TelegramBaseController {
    wanHandler($){
        let user = $._update._message._from;
        let debugName = "[/wan]";
        console.log(debugName + "Request from " + userData(user));

        if(user._id != 36710052){
            $.sendMessage('You are not authorized to get this information, ' + user._firstName + " " + user._lastName);
            return
        }

        publicIp.v4().then(ip =>{
            $.sendMessage('WAN: ' + ip);
        });
    };

    get routes(){
        return {
            '/wan': 'wanHandler'
        }
    };
}

let userList = {};
let createHackSession = function(interval, $){
    return setInterval(function(){
        $.sendMessage(getDateTime());
        // $.sendPhoto({ path: 'data/hacker.jpg'});
        // $.sendDocument({ path: 'data/hacker.html'});
    }, interval);
};
function getDateTime(){
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return hour + ":" + min + ":" + sec + " - " + day + "." + month + "." + year;
}
class HackerController extends TelegramBaseController {
    hackHandler($){
        let user = $._update._message._from;
        let debugName = "[/hack]";
        console.log(debugName + "Request from " + userData(user));

        if(userList.hasOwnProperty(user._id)){
            clearInterval(userList[user._id]['callback']);
            console.log(debugName + "Removed " + userData(user));
            $.sendMessage("You were removed from /hack .");
        } else {
            userList[user._id] = {'callback': createHackSession(5000, $)};
            console.log(debugName + "Added " + userData(user));
            $.sendMessage("You were added to /hack .\nIf you want to be removed, just send /hack again.");
        }
    };

    get routes(){
        return {
            '/hack': 'hackHandler'
        }
    };
}


class ReminderController extends TelegramBaseController {
    handle($){
        let user = $._update._message._from;
        let debugName = "[/remind]";
        console.log(debugName + "Request from " + userData(user));

        let data = $.query;
        let typeName = "minutes";
        let typeCoefficient = 1;

        let interval = parseInt(data.value);
        switch(data.type.toLowerCase()){
            case 'h':
            case 'hour':
                typeName = hours;
                typeCoefficient = 60;
            case 'm':
            case 'min':
            case 'minute':
                if(!interval){
                    $.sendMessage("Value was not a Number!");
                    break;
                }
                setTimeout(function(){
                    $.sendMessage("Hey, there was something to do: " + data.message);
                }, (interval * 60 * 1000 * typeCoefficient));
                $.sendMessage("You will be reminded in " + interval + " " + typeName + ".");
                break;
            case 'd':
            case 'date':
                $.sendMessage("Date is currently not supported.");
                break;
            default:
                console.log("unknown");
                $.sendMessage("Unknown type: " + data.type);
        }
    }
}

tg.router
    .when(['/start'], new StartController())
    .when(['/help'], new StartController())
    .when(['/ip'], new IPController())
    .when(['/wan'], new WanController())
    .when(['/hack'], new HackerController())
    .when(['/remind :type :value :message'], new ReminderController())
    .when(['/rm :type :value :message'], new ReminderController())
    .otherwise(new OtherwiseController())

console.log("TelegramBot running...");