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
                client.cwd(this.config.root, (err) => {
                    if (!err) {
                        return resolve({success: true});
                    }
                    
                    resolve({
                        success: false,
                        err
                    });
                });
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
            let servePath = path.join(targetPath, dirName);

            this.logger.info(`开始上传文件夹${ sourcePath }到${ servePath }`);

            let client = this.client;

            client.mkdir(servePath, true, err => {
                if (err) {
                    this.logger.error(`创建目录${ servePath }失败：${ err }`);
                    return reject({
                        success: false,
                        err
                    });
                }

                let files = this.getAllFiles(sourcePath);
                let promises = files.map(file => this._toUpload(file, servePath));

                Promise
                    .all(promises)
                    .then(() => {
                        this.logger.info(`文件夹上传成功`);
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

        }); 
    }

    _uploadFile (sourcePath, targetPath) {
        let fileName = path.basename(sourcePath);
        let servePath = path.join(targetPath, fileName);

        this.logger.info(`开始上传文件${ sourcePath }到${ servePath }`);

        return new Promise((resolve, reject) => {
            this.client.put(sourcePath, servePath, err => {

                if (err) {
                    this.logger.error(`文件${ sourcePath }上传失败：${ err }`);
                    return reject({
                        success: false,
                        err
                    });
                }

                this.logger.info(`文件${ sourcePath }上传成功`);
                resolve({
                    success: true
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