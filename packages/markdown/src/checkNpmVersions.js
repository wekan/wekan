import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

checkNpmVersions({
    'dompurify': '2.2.8',
}, 'my:xss');
