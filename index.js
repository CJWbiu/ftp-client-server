#!/usr/bin/env node

const program = require('commander');
const createFtpClient = require('./lib/ftp');

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
                console.log('上传成功');
            });
    }

    downloadFile (source, target, protocal = 'ftp') {
        createFtpClient(protocal)
            .download(source, target)
            .then(() => {
                console.log('下载成功');
            });
    }
}

new ClientServer();