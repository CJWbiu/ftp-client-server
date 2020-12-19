#!/usr/bin/env node

const program = require('commander');
const createFtpClient = require('./lib/ftp');
const logger = require('./util').getLogger();

class ClientServer {
    constructor () {
        this.init();
    }

    init () {
        this.initCommand();
    }

    initCommand () {
        program
            .command('upload <source>')
            .option('-t, --target <target>', 'target file path')
            .option('-p, --protocal [protocal]', 'protocal')
            .action((source, cmd) => {
                this.uploadFile(source, cmd.target, cmd.protocal);
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
        createFtpClient(protocal)
            .upload(source, target)
            .then(() => {
                logger.info('上传成功');
            })
            .catch(err => {
                logger.error(`上传失败：${err}`);
            });
    }

    downloadFile (source, target, protocal = 'ftp') {
        createFtpClient(protocal)
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