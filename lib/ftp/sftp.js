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
                this.logger.info(`连接成功`);
                resolve({ success: true });
            })
            .catch(err => {
                this.logger.err(`连接失败`);
                reject({
                    success: false,
                    err
                });
            });
        });
    }

    end () {
        this.client.end();
        this.logger.info(`连接已断开`);
    }

    async upload (sourcePath, targetPath) {
        if (!fs.existsSync(sourcePath)) {
            return false;
        }

        let { success, err } = await this.connect();

        if (!success) {
            this.logger.error(`连接失败：${ err }`);
            return;
        }
        return this
            ._toUpload(sourcePath, targetPath)
            .finally(() => {
                this.end();
            });
    }

    _toUpload (sourcePath, targetPath) {

        if (!this.isDirectory(sourcePath)) {
            return this._uploadFile(sourcePath, targetPath);
        }

        return new Promise((resolve, reject) => {
            let dirName = path.basename(sourcePath);
            let servePath = path.join(this.config.root, targetPath, dirName);

            this.logger.info(`开始上传文件夹${ sourcePath }到${ servePath }`);

            client
                .mkdir(servePath, true)
                .then(() => {
                    this.logger.info(`创建目录${ servePath }成功`);

                    let files = this.getAllFiles(sourcePath);
                    let promises = files.map(file => this._toUpload(file, servePath));

                    Promise
                        .all(promises)
                        .then(() => {
                            this.logger.info(`所有文件上传成功`);
                            resolve({ success: true });
                        })
                        .catch(err => {
                            this.logger.error(`文件夹上传失败：${ err }`);
                            reject({
                                success: false,
                                err
                            });
                        });
                })
                .catch(err => {
                    this.logger.error(`创建目录${ servePath }失败：${ err }`);
                    reject(err);
                });
        });
    }

    _uploadFile (sourcePath, targetPath) {
        let fileName = path.basename(sourcePath);
        let servePath = path.join(targetPath, fileName);

        return client.put(
            fs.createReadStream(sourcePath), 
            path.join(servePath)
        );
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