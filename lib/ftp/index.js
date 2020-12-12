/**
 * @file FTP
 */

const fs = require('fs');
const path = require('path');
const FtpClient = require('./ftp');
const SftpClient = require('./sftp');
const logger = require('../../util').getLogger();

const CLIENT_MAP = {
    ftp: FtpClient,
    sftp: SftpClient
};

module.exports = function createFtpClient (type) {
    let config = {};

    try {
        let jsonData = JSON.parse(fs.readFileSync(path.resolve('./config.json'), { encoding: 'utf-8' })); 
        config = jsonData[type];
    } catch (error) {
        logger.error(`创建连接失败：${ error }`);
        return;
    }

    let Client = CLIENT_MAP[type];

    if (!Client) {
        logger.warn('不支持的传输方式！');
        return;
    }

    return new Client(config);
};