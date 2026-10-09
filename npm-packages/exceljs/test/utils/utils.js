const fs = require('fs');
const _ = require('../../lib/utils/under-dash.js');

const main = {
  cleanDir(path) {
    const deferred = Promise.defer();

    const remove = function(file) {
      const myDeferred = Promise.defer();
      const myHandler = function(err) {
        if (err) {
          myDeferred.reject(err);
        } else {
          myDeferred.resolve();
        }
      };
      fs.stat(file, (err, stat) => {
        if (err) {
          myDeferred.reject(err);
        } else if (stat.isFile()) {
          console.log(`unlink ${file}`);
          fs.unlink(file, myHandler);
        } else if (stat.isDirectory()) {
          main
            .cleanDir(file)
            .then(() => {
              console.log(`rmdir ${file}`);
              fs.rmdir(file, myHandler);
            })
            .catch(myHandler);
        }
      });
      return myDeferred.promise;
    };

    fs.readdir(path, (err, files) => {
      if (err) {
        deferred.reject(err);
      } else {
        const promises = [];
        _.each(files, file => {
          promises.push(remove(`${path}/${file}`));
        });

        Promise.all(promises)
          .then(() => {
            deferred.resolve();
          })
          .catch(error => {
            deferred.reject(error);
          });
      }
    });

    return deferred.promise;
  },

  randomName(length) {
    length = length || 5;
    const text = [];
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++)
      text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

    return text.join('');
  },
  randomNum(d) {
    return Math.round(Math.random() * d);
  },

  fmt: {
    number(n) {
      // output large numbers with thousands separator
      const s = n.toString();
      const l = s.length;
      const a = [];
      let r = l % 3 || 3;
      let i = 0;
      while (i < l) {
        a.push(s.substr(i, r));
        i += r;
        r = 3;
      }
      return a.join(',');
    },
  },
};

module.exports = main;
