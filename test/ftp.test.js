const FtpTool = require('../lib/ftp/ftp-tool');

let options = {
    "host": "47.107.157.97",
    "port": 21,
    "user": "ftp",
    "password": "Admin@123",
    "root": "/cjw"
};

describe('连接测试', () => {
    test('测试连接', () => {
        let ftpClient = new FtpTool('ftp', options);
        return expect(ftpClient.connect())
            .resolves
            .toBeUndefined();
    });
});

describe('上传测试', () => {
    test('测试上传本地不存在的文件', () => {
        let ftpClient = new FtpTool('ftp', options);
        
        return expect(ftpClient.upload('xxxx', './'))
            .rejects
            .toThrow('路径不存在');
    });
    
    test('测试上传存在的文件', () => {
        let ftpClient = new FtpTool('ftp', options);
        return expect(ftpClient.upload('./files/img1.jpeg', './'))
            .resolves
            .toBeUndefined();
    });
    
    test('测试上传多个存在的文件', () => {
        let ftpClient = new FtpTool('ftp', options);
        let fileList = ['./files/img1.jpeg', './files/inner/img2.jpeg'];
        return expect(ftpClient.upload(fileList, './'))
            .resolves
            .toBeUndefined();
    });
    
    test('测试上传多个存在的文件包含文件夹', () => {
        let ftpClient = new FtpTool('ftp', options);
        let fileList = ['./files', './files/inner/img2.jpeg'];
        return expect(ftpClient.upload(fileList, './'))
            .resolves
            .toBeUndefined();
    });
});

describe('下载测试', () => {
    test('测试下载文件成功', () => {
        let ftpClient = new FtpTool('ftp', options);
        return expect(ftpClient.download('./img1.jpeg', './files'))
            .resolves
            .toBeUndefined();
    });
    
    test('测试下载：本地路径不存在', () => {
        let ftpClient = new FtpTool('ftp', options);
        return expect(ftpClient.download('./img1.jpeg', './xxx'))
            .rejects
            .toThrow('下载文件存放路径不存在');
    });
    
    test('测试下载：本地路径不是文件夹', () => {
        let ftpClient = new FtpTool('ftp', options);
        return expect(ftpClient.download('./img1.jpeg', './files/img1.jpeg'))
            .rejects
            .toThrow('下载文件存放路径必须是文件夹');
    });
});