import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

checkNpmVersions({
    'xss': '1.0.6',
}, 'my:xss');
