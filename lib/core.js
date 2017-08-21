let moment = require('moment');
let process = require('child_process');
let exec = process.exec;
let prefix = 'v',
    suffix = '',
    delimiter = '.',
    tag_max = '', // the max version tag
    version_max = '0.0.0', // the max version
    version_now = '0.0.0'; // Eg: the alpha version

let Log = (function () {
    let _console = console;
    let _log = function () {
        _console.log.apply(null, Array.prototype.slice.call(arguments));
    };
    for (let key in _console) {
        _log[key] = _console[key];
    }
    return _log;
})()



function commands (type) {
     const commands_list = {
         base: 'git tag -l --sort=-version:refname ' + prefix + '*',
         alpha: 'git tag -l --sort=-version:refname ' + prefix + version_now + '*alpha*',
         beta: 'git tag -l --sort=-version:refname ' + prefix + version_now + '*beta*',
         rc: 'git tag -l --sort=-version:refname ' + prefix + version_now + '*rc*'
     }
    return commands_list[type]
}

function execCommandGetFirstTag (_command) {
    Log.log('command:', _command)
    return new Promise(function (resolve, reject) {
        exec(_command, function (err, stdout) {
            let res = stdout.split('\n');
            let tag_first = res[0];
            if (err) {
                reject();
            } else {
                resolve(tag_first);
            }
        });
    })
}

function getTagList () {
    return new Promise(function (resolve, reject) {
        let command = 'git tag -l ' + prefix + '*' + suffix;
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
    let command = '';
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

// get the new base version, such as v1.2.3, and set the type=major. this will get v2.2.3
function baseVersion (type) {
    let version_new = '0.0.0',
        version_arr = version_max.split(delimiter)
    const major = parseInt(version_arr[0]) || 0
    const minor = parseInt(version_arr[1]) || 0
    const patch = parseInt(version_arr[2]) || 0
    switch (type) {
        case 'major':
            version_new = `${major + 1 + delimiter}0${delimiter}0`
            break
        case 'minor':
            version_new = `${version_arr[0] + delimiter + (minor + 1) + delimiter}0`
            break;
        case 'patch':
        default:
            version_new = `${version_arr[0] + delimiter + minor + delimiter + (patch + 1)}`
    }
    var tag_new = `${prefix + version_new}`
    Log.log(tag_new)
    return tag_new
}

// get the new version of alpha, beta, release
async function stageVersion (type) {
    let alpha_max = 0;
    let version_new = '';
    tag_max = await execCommandGetFirstTag(commands(type))
    if (tag_max) {
        const reg = new RegExp(`${type}\\.?(\\d+)`)
        const regRes = reg.exec(tag_max)
        if (regRes) {
            alpha_max = regRes[1]
            version_new = tag_max.replace(reg, String(type) + (parseInt(alpha_max) + 1))
        }
    } else {
        version_new = prefix + version_max + '-' + String(type) + (parseInt(alpha_max) + 1)
    }
    console.log(`stageVersion ${type}:`, version_new)
    return version_new
}

async function getTag_maxVersion () {
    const _tag_max = await execCommandGetFirstTag(commands('base'))
    return _tag_max
}

function Custom (version_arr) {

}
// 查询当前最大版本, 可以查询base(major, minor, patch), alpha, beta, rc
async function findBaseVersion (type) {
    let command_type = '';
    delimiter = delimiter || '.'
    switch (type) {
        case 'major':
        case 'minor':
        case 'patch':
        case 'base':
            command_type = 'base'
            break
        default:
            command_type = type
    }
    tag_max = await execCommandGetFirstTag(commands(command_type))
    const reg = prefix + '([\\d\\' + delimiter + ']+)' + suffix;
    version_now = new RegExp(reg).exec(tag_max)[1];
    Log.log('The max version is', tag_max)
    return version_now
}

async function init () {
    prefix = prefix || 'v';
    suffix = '';
    version_max = await findBaseVersion('base')
}

module.exports = function () {
    const type = 'major'
    init()
        .then(function () {
            switch (type) {
                case 'major':
                case 'minor':
                case 'patch':
                    baseVersion(type)
                    break
                default:
                    stageVersion(type)
            }
        })
}