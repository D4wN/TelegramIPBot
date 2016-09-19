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
    "/wan : get current wan address";

class StartController extends TelegramBaseController {
    handle($){
        let cmd = $._update._message._text;
        let user = $._update._message._from;
        let debugName = "[/start]";
        console.log(debugName + "Request from " + userData(user));

        $.sendMessage("Welcome "+ user._firstName +"\n\n" + helpText);
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

tg.router
    .when(['/start'], new StartController())
    .when(['/help'], new StartController())
    .when(['/ip'], new IPController())
    .when(['/wan'], new WanController())
    .otherwise(new OtherwiseController())

console.log("TelegramBot running...");