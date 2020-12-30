# ftp-upload
> 基于ftp、ssh2-sftp-client封装的文件上传工具

## 用法
### 上传
```javascript
const uploader = require('./lib/uploader.js');

let config = {
    "host": "47.107.157.97",
    "port": 21,
    "user": "ftp",
    "password": "Admin@123",
    "root": "/cjw"
};
let client = new Uploader('ftp', config);

client
    .upload('/xx.png', './imgs')
    .then(() => {
        logger.info('上传成功');
    })
    .catch(err => {
        logger.error(`上传失败：${err}`);
    });
```

### 下载
```javascript
const uploader = require('./lib/uploader.js');

let config = {
    "host": "47.107.157.97",
    "port": 21,
    "user": "ftp",
    "password": "Admin@123",
    "root": "/cjw"
};
let client = new Uploader('ftp', config);

client
    .download('/xx.png', './imgs')
    .then(() => {
        logger.info('下载成功');
    })
    .catch(err => {
        logger.error(`下载失败：${err}`);
    });
```
> sftp用法与ftp一致，只需将第一个参数改为‘sftp’即可