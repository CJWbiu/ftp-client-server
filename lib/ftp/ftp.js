/**
 * @file FTP
 */

const { createConnection } = require('net');

class FTP {
    constructor (cfg) {
        if (!cfg.host || !cfg.port) {
            throw new Error('Missing parameters: host,port');
        }

        this.host = cfg.host;
        this.port = cfg.port;
        this.user = cfg.user || '';
        this.pass = cfg.password || '';
        this.type = cfg.type || 'ftp';

        this._connectServer(this.host, this.port);
    }

    _connectServer (host, port) {
        this.socket = createConnection(host, port);
    }
}

module.exports = FTP;