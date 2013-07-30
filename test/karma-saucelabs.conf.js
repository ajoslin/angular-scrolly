
var shared = require('./karma-shared.conf.js');

module.exports = function(config) {
  shared(config);
  config.set({
    reporters: ['dots'],
    singleRun: true,
    sauceLabs: {
      testName: 'angular-scrolly',
      username: 'angular-scrolly',
      accessKey: '0691f5ec-ddc3-4c42-a42e-b17e9cae9c9e',
      startConnect: true,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
    },
    customLaunchers: {
      'sauce_ios': {
        base: 'SauceLabs',
        platform: 'OS X 10.8',
        browserName: 'iphone',
        version: '6'
      },
      'sauce_android': {
        base: 'SauceLabs',
        platform: 'Linux',
        browserName: 'android',
        version: '4.0'
      },
     'sauce_chrome': {
        base: 'SauceLabs',
        platform: 'Linux',
        browserName: 'chrome'
      },
     'sauce_firefox': {
        base: 'SauceLabs',
        platform: 'Linux',
        browserName: 'firefox'
      },
      'sauce_ie': {
        base: 'SauceLabs',
        platform: 'Windows 8',
        browserName: 'internet explorer',
        version: '10'
      }
    },
  });
};
