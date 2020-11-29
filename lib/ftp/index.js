/**
 * @file FTP
 */

const FtpClient = require('./ftp');
const SftpClient = require('./sftp');

module.exports = function createFtpClient (options) {
    let { type, config } = options;

    if (type === 'sftp') {
        return new SftpClient(config);
    }

    return new FtpClient(config);
};