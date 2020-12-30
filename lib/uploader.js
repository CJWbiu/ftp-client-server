/**
 * @file FTP
 */

const fs = require('fs');
const path = require('path');
const FtpClient = require('./ftp/ftp_promise');
const SftpClient = require('ssh2-sftp-client');
const logger = require('../logger');
const { parseFiles } = require('./glob');

// 最大并发数
const MAX_CONCURRENT = 5;

const CLIENT_MAP = {
    ftp: FtpClient,
    sftp: SftpClient
};

class Uploader {
    constructor (type, config) {
        let Client = CLIENT_MAP[type];

        if (!Client) {
            logger.warn('不支持的传输方式，只支持ftp或sftp');
            return;
        }

        let validate = this._validateConfig(config);

        if (!validate.isValid) {
            logger.warn(validate.errText);
            return;
        }

        this.config = {...config};
        this.client = new Client();
    }

    _validateConfig (config) {
        let checkFields = [
            {
                field: 'host',
                type: 'string'
            },
            {
                field: 'port',
                type: 'number'
            },
            {
                field: 'user',
                type: 'string'
            },
            {
                field: 'password',
                type: 'string'
            },
            {
                field: 'root',
                type: 'string'
            }
        ];
        let looseFields = [];
        let typeErrs = [];
        checkFields.forEach(({field, type}) => {
            if (!config.hasOwnProperty(field)) {
                looseFields.push(field);
                return;
            }

            if (typeof config[field] !== type) {
                typeErrs.push(`${field}(${type})`);
            }
        });

        if (looseFields.length) {
            return {
                isValid: false,
                errText: `参数缺失：${looseFields.join(',')}`
            };
        }

        if (typeErrs.length) {
            return {
                isValid: false,
                errText: `参数类型错误：${looseFields.join(',')}`
            };
        }

        return {
            isValid: true
        };
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
        let fileList = parseFiles(sourcePath);

        logger.debug(`上传文件：${JSON.stringify(fileList)}`);

        try {
            await this.connect();
        } catch (error) {
            this.end();
            logger.debug(`连接失败: ${error}`);
            return Promise.reject('连接失败');
        }

        let fileGroup = this._split(fileList);

        fileGroup.forEach(async (list) => {
            try {
                await Promise.all(list.map(file => this._toUpload(file, targetPath)));
            } catch (error) {
                logger.error(`部分文件上传失败：${error}`);
                isAllSuccess = false;
            }
        });

        this.end();
        return Promise.resolve();
    }

    _split (list) {
        let group = [];

        for (let i = 0; i < list.length; i += MAX_CONCURRENT) {
            group.push(list.slice(i, i + MAX_CONCURRENT));
        }

        return group;
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

module.exports = Uploader;