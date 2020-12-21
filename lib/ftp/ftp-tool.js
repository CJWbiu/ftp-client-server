/**
 * @file FTP
 */

const fs = require('fs');
const path = require('path');
const FtpClient = require('./ftp-promise');
const SftpClient = require('ssh2-sftp-client');
const logger = require('../../logger');

const CLIENT_MAP = {
    ftp: FtpClient,
    sftp: SftpClient
};

class FtpTool {
    constructor (type, config) {
        let Client = CLIENT_MAP[type];

        if (!Client) {
            logger.warn('不支持的传输方式，只支持ftp或sftp');
            return;
        }

        this.config = {...config};
        this.client = new Client();
    }

    connect () {
        let config = this.config;

        return this.client.connect({
            host: config.host,
            port: config.port,
            username: config.user,
            password: config.password
        });
    }

    async upload (sourcePath, targetPath) {
        if (!fs.existsSync(sourcePath)) {
            return false;
        }

        try {
            await this.connect();
        } catch (error) {
            logger.debug(`连接失败：${error}`);
            return error;
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

            logger.debug(`开始上传文件夹${ sourcePath }到${ servePath }`);

            client
                .mkdir(servePath, true)
                .then(() => {
                    logger.info(`创建目录${ servePath }成功`);

                    let files = this.getAllFiles(sourcePath);
                    let promises = files.map(file => this._toUpload(file, servePath));

                    Promise
                        .all(promises)
                        .then(() => {
                            logger.info(`所有文件上传成功`);
                            resolve();
                        })
                        .catch(err => {
                            logger.error(`文件夹上传失败：${ err }`);
                            reject(err);
                        });
                })
                .catch(err => {
                    logger.error(`创建目录${ servePath }失败：${ err }`);
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

        try {
            await this.connect();
        } catch (error) {
            logger.debug(`连接失败：${error}`);
            return error;
        }

        return new Promise((resolve, reject) => {
            let client = this.client;
            let ws = fs.createWriteStream(targetPath);

            client.get(path.join(this.config.root, sourcePath), ws)
                .then(() => {
                    client.end(); 
                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    end () {
        this.client.end();
        this.client = null;
        logger.info('连接已断开');
    }

    isDirectory (filePath) {
        return fs.statSync(filePath).isDirectory();
    }

    getAllFiles (dirPath) {
        let files = [];

        try {
            files = fs.readdirSync(dirPath);
        } catch (err) {
            logger.error(`读取目录${ dirPath }失败：${ err.toString() }`);
        }

        return files.map(filePath => path.resolve(dirPath, filePath));
    }
}

module.exports = FtpTool;