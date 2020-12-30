/**
 * @file 封装ftp
 */

const Client = require('ftp');

class FtpPromise {
    constructor () {
        this.client = new Client();
    }

    connect (config) {
        return new Promise((resolve, reject) => {
            let client = this.client;

            client.on('ready', (err) => {
                if (!err) {
                    return resolve();
                }

                return reject(err);
            });

            client.connect(config);
        });
    }

    mkdir (path, recursive) {
        return new Promise((resolve, reject) => {
            let client = this.client;

            client.mkdir(path, recursive, err => {
                if (err) {
                    return reject(err);
                }

                resolve();
            })
        });
    }

    put (src, remotePath) {
        return new Promise((resolve, reject) => {
            let client = this.client;

            client.put(src, remotePath, err => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    get (path, dst) {
        return new Promise((resolve, reject) => {
            let client = this.client;

            client.get(path, (err, stream) => {
                if (err) {
                    return reject(err);
                }

                stream.once('close', () => {
                    resolve();
                });
                stream.pipe(dst);
            });
        });
    }

    end () {
        this.client.end();
    }
}

module.exports = FtpPromise;