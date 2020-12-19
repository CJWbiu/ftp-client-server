/**
 * @file 基类
 */

const { getLogger } = require('../../util');

class BaseFtp {
    constructor () {
        this.logger = getLogger();
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

    connect () {
        throw new Error('');
    }

    upload () {
        throw new Error('');
    }

    download () {
        throw new Error('');
    }

    end () {
        throw new Error('');
    }
}

module.exports = BaseFtp;