/**
 * @file 基类
 */

class BaseFtp {
    connect () {
        throw new Error('');
    }

    upload () {
        throw new Error('');
    }

    download () {
        throw new Error('');
    }
}

module.exports = BaseFtp;