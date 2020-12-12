const log4js = require('log4js');

exports.getLogger = function () {

    log4js.configure({
        appenders: {
    
            // 输出到控制台
            out: {
                type: 'stdout'
            },
    
            // 输入到日志
            operate: {
                type: 'file',
                filename: 'operate.log'
            }
        },
        categories: {
            default: {
                appenders: ['out', 'operate'],
                level: 'all'
            }
        }
    });

    return log4js.getLogger();
}