/**
 * @file FTP
 */

const fs = require('fs');
const path = require('path');
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
                resolve({success: true});
            });

            client.on('error', (err) => {
                reject({
                    success: false,
                    err
                });
            });

            client.connect({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password
            });
        });
    }

    end () {
        this.client.end();
    }

    async upload (sourcePath, targetPath) {
        if (!fs.existsSync(sourcePath)) {
            return false;
        }

        let { success, err } = await this.connect();

        if (!success) {
            console.log(err.toString());
            return;
        }

        return new Promise((resolve, reject) => {
            let client = this.client;
            let cb = err => {

                client.end();

                if (err) {
                    return reject({
                        success: false,
                        err
                    });
                }
                resolve({
                    success: true
                });
            };

            if (fs.statSync(sourcePath).isDirectory()) {
                client.mkdir(path.join(this.config.root, sourcePath), true, cb);
                return ;
            }

            client.put(sourcePath, path.join(this.config.root, targetPath), cb);
        });
    }

    async download (sourcePath, targetPath) {

        let { success, err } = await this.connect();

        if (!success) {
            console.log(err.toString());
            return;
        }

        return new Promise((resolve, reject) => {
            let client = this.client;
            client.get(path.join(this.config.root, sourcePath), function(err, stream) {
                if (err) {
                    return reject({ success: false, err });
                }
                
                let ws = fs.createWriteStream(targetPath);

                stream.once('close', () => { 
                    client.end(); 
                    resolve({ success: true });
                });
                stream.pipe(ws);
            });
        });
    }
}

module.exports = Ftp;