/**
 * @file SFTP
 */

const fs = require('fs');
const path = require('path');
const Client = require('ssh2-sftp-client');
const BaseFtp = require('./base-ftp');

class Sftp extends BaseFtp {
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
            client.connect({
                host: this.config.host,
                port: this.config.port,
                username: this.config.user,
                password: this.config.password
            })
            .then(() => {
                console.log('connect success');
                resolve({ success: true });
            })
            .catch(err => {
                reject({
                    success: false,
                    err
                });
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
            let promise;

            if (fs.statSync(sourcePath).isDirectory()) {
                promise = client.mkdir(path.join(this.config.root, sourcePath), true);
            } else {
                promise = client.put(
                    fs.createReadStream(sourcePath), 
                    path.join(this.config.root, targetPath)
                );
            }

            promise
                .then(() => {
                    client.end();
                    resolve({
                        success: true
                    });
                })
                .catch(err => {
                    return reject({
                        success: false,
                        err
                    });
                });
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
            let ws = fs.createWriteStream(targetPath);

            client.get(path.join(this.config.root, sourcePath), ws)
                .then(() => {
                    client.end(); 
                    resolve({ success: true });
                })
                .catch(err => {
                    reject({ success: false, err });
                });
        });
    }
}

module.exports = Sftp;