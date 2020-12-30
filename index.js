#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const program = require('commander');
const Uploader = require('./lib/uploader');
const logger = require('./logger');

class ClientServer {
    constructor () {
        this.config = {};
        this.init();
    }

    init () {
        this.initDefaultConfig();
        this.initCommand();
    }

    initDefaultConfig () {
        try {
            let jsonData = JSON.parse(fs.readFileSync(path.resolve('./config.json'), { encoding: 'utf-8' })); 
            this.config = jsonData;
        } catch (error) {
            logger.error(`读取配置文件失败：${ error }`);
            return;
        }
    }

    initCommand () {
        program
            .command('upload <source>')
            .option('-t, --target <target>', 'target file path')
            .option('-p, --protocal [protocal]', 'protocal')
            .action((source, cmd) => {
                this.uploadFile(source.split(','), cmd.target, cmd.protocal);
            });

        program
            .command('download <source>')
            .option('-t, --target <target>', 'target file path')
            .option('-p, --protocal [protocal]', 'protocal')
            .action((source, cmd) => {
                this.downloadFile(source, cmd.target, cmd.protocal);
            });

        program.parse(process.argv)
    }

    uploadFile (source, target, protocal = 'ftp') {
        let client = new Uploader(protocal, this.config[protocal]);
        client
            .upload(source, target)
            .then(() => {
                logger.info('上传成功');
            })
            .catch(err => {
                logger.error(`上传失败：${err}`);
            });
    }

    downloadFile (source, target, protocal = 'ftp') {
        let client = new Uploader(protocal, this.config[protocal]);
        client
            .download(source, target)
            .then(() => {
                logger.info('下载成功');
            })
            .catch(err => {
                logger.error(`下载失败：${err}`);
            });;
    }
}

new ClientServer();