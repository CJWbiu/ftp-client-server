const log4js = require('log4js');
const os = require('os'); 

function getLocalIP () {
    let address = '';
    let interfaces = os.networkInterfaces();

    for (let devName in interfaces) {  
        let iface = interfaces[devName];  
        for(let i = 0; i < iface.length; i++){  
                let alias = iface[i];  
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){  
                    address = alias.address;  
                }  
        }  
    } 

    return address;
}

log4js.configure({
    replaceConsole: true,
    appenders: {
        console: {
            type: 'stdout'
        }, 
        cheese: {
            type: 'dateFile',
            filename: 'logs/myLog.log',
            encoding: 'utf-8',
            layout: {
                type: "pattern",
                pattern: '%d %p %c [%x{ip}] -- %m%n',
                tokens: {
                    ip: getLocalIP
                }
            },
            pattern: "-yyyy-MM-dd",
            keepFileExt: true,
            alwaysIncludePattern: true,
        },
    },
    categories: {
        default: {
            appenders: ['console', 'cheese'], 
            level: 'info'
        },
        dev: {
            appenders: ['cheese'],
            level: 'debug'
        }
    }
});

const logger = (function () {
    let categoryMap = {
        default: ['info', 'warn', 'error'],
        dev: ['trace', 'debug']
    };
    let result = {};

    Object.keys(categoryMap)
        .forEach(type => {
            let levels = categoryMap[type];
            levels.forEach(level => {
                result[level] = (str) => {
                    return log4js.getLogger(type)[level](str);
                };
            });
        });
    
    return result;
})();

module.exports = logger;