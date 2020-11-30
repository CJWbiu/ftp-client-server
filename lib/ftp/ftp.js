/**
 * @file FTP
 */

const BaseFtp = require('./base-ftp');
const Client = require('ftp');

class Ftp extends BaseFtp {
    constructor (cfg) {
        super();
        
        if (!cfg.host || !cfg.port) {
            throw new Error('Missing parameters: host,port');
        }

        this.config = {...cfg};
        this.client = new Client();
    }

    connect () {
        return new Promise((resolve, reject) => {
            let client = this.client;

            client.on('ready', () => {
                resolve();
            });

            client.on('error', (err) => {
                reject(err);
            });

            client.connect({
                ...this.config
            });
        });
    }

    end () {
        this.client.end();
    }

    list () {
        return new Promise((resolve, reject) => {
            let client = this.client;
            
            client.list((err, list) => {
                if (err) {
                    return reject(err);
                }

                resolve(list);
            });
        });
    }

    upload () {
        
    }

    download () {
        
    }
}

module.exports = Ftp;