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
        let fileList = Array.isArray(sourcePath) ? sourcePath : [sourcePath];

        logger.debug(`上传文件：${JSON.stringify(fileList)}`);

        try {
            await this.connect();
        } catch (error) {
            this.end();
            logger.debug(`连接失败: ${error}`);
            return Promise.reject('连接失败');
        }

        try {
            await Promise.all(fileList.map(file => this._toUpload(file, targetPath)));
            this.end();
            return Promise.resolve();
        } catch (error) {
            this.end();
            return Promise.reject(error);
        } 
    }

    _toUpload (sourcePath, targetPath) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(sourcePath)) {
                return reject(new Error('路径不存在'));
            }
    
            let dirName = path.basename(sourcePath);
            let servePath = path.join(this.config.root, targetPath, dirName);
            let client = this.client;
    
            if (!this._isDirectory(sourcePath)) {
                client.put(fs.createReadStream(sourcePath), path.join(servePath))
                    .then(() => {
                        resolve();
                    })
                    .catch(err => {
                        logger.debug(`上传文件${sourcePath}失败: ${err}`);
                        reject(new Error(`上传文件${sourcePath}失败`));
                    });
                return;
            }
    
            client.mkdir(servePath, true)
                .then(() => {
                    resolve();
                })
                .catch(err => {
                    logger.debug(`创建远处目录${sourcePath}失败: ${err}`);
                    reject(new Error(`创建远处目录${sourcePath}失败`));
                });
        });
    }

    async download (sourcePath, targetPath) {
        if (!fs.existsSync(targetPath)) {
            return Promise.reject(new Error('下载文件存放路径不存在'));
        }

        if (!this._isDirectory(targetPath)) {
            return Promise.reject(new Error('下载文件存放路径必须是文件夹'));
        }

        let fileName = path.basename(sourcePath);
        let localPath = path.resolve(targetPath, fileName);

        try {
            await this.connect();
            await this._toDownload(sourcePath, localPath);
        } catch (error) {
            logger.debug(`下载${sourcePath}失败：${error}`);
            return Promise.reject('下载失败');
        } finally {
            this.end();
        }
    }

    _toDownload (sourcePath, targetPath) {
        new Promise((resolve, reject) => {
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

    _isDirectory (filePath) {
        return fs.statSync(filePath).isDirectory();
    }
}

module.exports = FtpTool;