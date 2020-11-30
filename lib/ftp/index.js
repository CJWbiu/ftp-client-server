/**
 * @file FTP
 */

const fs = require('fs');
const path = require('path');
const FtpClient = require('./ftp');
const SftpClient = require('./sftp');

module.exports = function createFtpClient (type) {
    let config = {};

    try {
        let jsonData = JSON.parse(fs.readFileSync(path.resolve('./config.json'), { encoding: 'utf-8' })); 
        config = jsonData[type];
    } catch (error) {
        console.log(error);
        return;
    }

    if (type === 'sftp') {
        return new SftpClient(config);
    }

    return new FtpClient(config);
};