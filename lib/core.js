var moment = require('moment');
var process = require('child_process');
var exec = process.exec;

var delimiter;

var Log = (function () {
    var _console = console;
    var _log = function () {
        _console.log.apply(null, Array.prototype.slice.call(arguments));
    };
    for (var key in _console) {
        _log[key] = _console[key];
    }
    return _log;
})()


function getTagList (prefix, suffix) {
    return new Promise(function (resolve, reject) {
        var command = 'git tag -l ' + prefix + '*' + suffix;
        Log.log(command)
        exec(command, function (err, stdout) {
            if (err) {
                reject(err);
            }
            resolve(stdout);
        });
    });
}

function createTag (tagName, msg) {
    var command = '';
    if (msg) {
        command = 'git tag -a tagName -m msg';
    } else {
        command = 'git tag tagName';
    }
    return new Promise(function (resolve, reject) {
        Log.log('command', command)
        exec(command, function (err, stdout) {
            if (err) {
                reject(err);
            }
            resolve(stdout)
        });
    });
}

function Patch (version_arr) {
    version_arr[2] = parseInt(version_arr[2]) + 1;
    var res = version_arr.join(delimiter);
    Log.log(res)
    return res;
}

function Minor (version_arr) {
    version_arr[1] = parseInt(version_arr[1]) + 1;
    var res = version_arr.join(delimiter);
    Log.log(res)
    return res;
}

function Major (version_arr) {
    version_arr[0] = parseInt(version_arr[0]) + 1;
    var res = version_arr.join(delimiter);
    Log.log(res)
    return res;
}

function Custom (version_arr) {

}

function findMaxVersion (prefix, suffix, delimiter) {
    delimiter = delimiter || '.';
    var command = 'git tag -l --sort=-version:refname ' + prefix + '*';
    return new Promise(function (resolve, reject) {
        exec(command, function (err, stdout) {
            var res = stdout.split('\n');
            var tag_max = res[0];
            var reg = prefix + '([\\d\\' + delimiter + ']+)' + suffix;
            var version_now = new RegExp(reg).exec(tag_max)[1];
            var version_arr = version_now.split(delimiter);
            Log.log('The max version is', tag_max)
            if (err) {
                reject();
            } else {
                resolve({
                    version_now: version_now,
                    version_arr: version_arr
                });
            }
        });
    })
}

function init () {
    var tagList = [];
    var prefix = 'crm/v';
    var version = 'x.x.x';
    var suffix = '';
    var tpl = 'crm/v{version}postfix';
    tpl = tpl.replace(/\s/g, '');
    var delimiter = new RegExp('x(.+?)').exec(version)[1];
    var reg_pre = /^([^\{\}]*)/g;
    var reg_version = /\{([^\{\}]+)\}/;
    var reg_major = /\{(major)\}/g;
    var reg_minor = /\{(minor)\}/g;
    var reg_patch = /\{(patch)\}/g;
    var prefix = reg_pre.exec(tpl)[1];
    // reg_major.exec(tpl);
    // reg_minor.exec(tpl);
    // reg_patch.exec(tpl);

    getTagList(prefix, suffix)
        .then(function (res) {
            tagList = res.split('\n');
        }, function (err) {
            Log.log(err);
        });

    findMaxVersion(prefix, suffix, delimiter)
        .then(version_max => {
            Patch(version_max.version_arr);
            Major(version_max.version_arr);
            Minor(version_max.version_arr);
        });
}


module.exports = function () {
    init();
}