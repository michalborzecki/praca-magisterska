function fetchTestUrls() {
  return fetch('/test_urls').then(res => res.json());
}

function performTest(urls, urlIndex) {
  document.querySelector('#status-text').innerHTML = 'Using ' + urls[urlIndex];
  var iframe = document.querySelector('#test-window');
  iframe.src = urls[urlIndex];
  return new Promise(resolve => {
    var intervalId = setInterval(() => {
      var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (innerDoc && innerDoc.querySelector('#tests-done')) {
        clearInterval(intervalId);
        resolve();
      }
    }, 500);
  }).then(() => {
    if (urlIndex !== urls.length - 1) {
      return performTest(urls, urlIndex + 1);
    } else {
      document.querySelector('#status-text').innerHTML = 'Tests done';
    }
  });
}

fetchTestUrls().then((response) => {
  var urls = response.urls;
  performTest(urls, 0);
});
