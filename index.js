#!/usr/bin/env node

const inquirer = require('inquirer');
const program = require('commander');
const createFtpClient = require('./lib/ftp');

class ClientServer {
    constructor () {
        this.ftpClient = null;
        this.questions = [
            {
                type: 'input',
                name: 'host',
                validate (value) {
                    return value !== '' || '请输入服务器地址';
                }
            },
            {
                type: 'input',
                name: 'port',
                filter: Number,
                validate (value) {
                    return (value !== '' && typeof value === 'number') || '请输入端口号';
                }
            },
            {
                type: 'input',
                name: 'user'
            },
            {
                type: 'input',
                name: 'password'
            }
        ]

        this.init();
    }

    init () {
        this.initCommand();
    }

    initCommand () {
        program
            .command('ftp-login')
            .action(() => {
                this.receiveConfig('ftp');
            });

        program
            .command('sftp-login')
            .action(() => {
                this.receiveConfig('sftp');
            });

        program.parse(process.argv);
    }

    receiveConfig (type) {
        inquirer
            .prompt(this.questions)
            .then(answers => {
                let options = {
                    type,
                    config: answers
                };

                this.ftpClient = createFtpClient(options);
                this.ftpClient
                    .connect()
                    .then(() => {
                        return this.ftpClient.list();
                    })
                    .then((data) => {
                        console.log(this.formatFileList(data));
                    })
                    .then(() => {
                        this.ftpClient.end();
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            });
    }

    /**
     * 格式化文件列表
     * @param {*} data 
     */
    formatFileList (data) {
        return data;
    }
}

new ClientServer();