const performance = require('perf_hooks').performance;
const fetch = require('node-fetch');

let serverLocation = '';

function fetchTestsConfig() {
  return fetch(serverLocation + '/tests_config').then(res => res.json());
}

function sendTestsResults(results) {
  return fetch(serverLocation + '/tests_result', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(results),
  });
}

function collectTestResults(testsCallbacks) {
  var testPromise = Promise.resolve();
  var results = [];
  testsCallbacks.forEach(testCallback => {
    testPromise = testPromise.then(testCallback)
      .then(result => results.push(result))
      .catch(error => {
        console.error(error);
        results.push('error');
      });
  });
  return testPromise.then(() => results);
}

function countResultsAverage(result) {
  for (var i = 0; i < result.length; i++) {
    if (typeof result[i] === 'string') {
      // special value
      return result[i];
    }
  }
  if (typeof result[0] === 'number') {
    return result.reduce((s, r) => s + r, 0) / result.length;
  } else if (typeof result[0] === 'object') {
    var keys = Object.keys(result[0]);
    var sum = keys.reduce((s, k) => {
      s[k] = 0;
      return s;
    }, {});
    result.forEach(r => {
      keys.forEach(k => {
        sum[k] += r[k];
      });
    });
    keys.forEach(k => {
      sum[k] /= result.length;
    });
    return sum;
  }
}

function repeatTest(testCallback, n, results) {
  var testsCallbacks = [];
  for (var i = 0; i < n; i++) {
    testsCallbacks.push(testCallback);
  }
  return collectTestResults(testsCallbacks);
}

function performTests(libraryName, testsFunctions) {
  return fetchTestsConfig().then(config => {
    var tests = config.tests;
    var results = {};
    var testPromise = Promise.resolve();
    var testNames = Object.keys(tests);
    var indexDone = 0;
    var testFunctionsCollections = {};
    for (var testName of testNames) {
      testFunctionsCollections[testName] = testsFunctions[testName](tests[testName])
        .map(f => () => repeatTest(() => f(), tests[testName].repeat || 1));
      testPromise = testPromise.then(() => collectTestResults(testFunctionsCollections[testNames[indexDone]]))
        .then(results => results.map(countResultsAverage))
        .then(res => {
          results[testNames[indexDone]] = res;
          indexDone += 1;
        });
    }
    return testPromise
      .then(() => {
        return sendTestsResults({
          library: libraryName,
          results,
        });
      });
  });
}

if (typeof window === 'undefined') {
  global.performance = performance;
  global.performTests = performTests;
  const toolName = process.argv[2];
  serverLocation = 'http://127.0.0.1:4200';
  var test = require('./tests/' + toolName + '/index');
}


