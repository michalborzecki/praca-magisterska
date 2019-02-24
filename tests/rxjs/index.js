import { Subject, combineLatest, from } from 'rxjs';
import { map } from 'rxjs/operators';

var testsFunctions = {
  simpleChain: config => config.size.map(size => () => simpleChain(size)),
  fullyConnectedLayers: config => config.size.map(size => () => fullyConnectedLayers(size)),
  fullyConnectedLayers2x: config => config.size.map(size => () => fullyConnectedLayers2x(size)),
  simpleSequence: config => config.size.map(size => () => simpleSequence(size)),
  simpleTree: config => config.size.map(size => () => simpleTree(size)),
};

performTests('rxjs', testsFunctions);

function simpleChain(n) {
  return new Promise(resolve => {
    var constructT0 = performance.now();

    var subject = new Subject();
    var obs = subject.asObservable();
    
    for (var i = 0; i < n; i++) {
      obs = obs.pipe(map(x => x + 1));
    }

    var constructT = performance.now() - constructT0;

    var evalT0 = performance.now();
    obs.subscribe(() => {
      var evalT = performance.now() - evalT0;
      resolve({
        construct: constructT,
        eval: evalT,
      });
    });
    subject.next(1);
  })
}

function fullyConnectedLayers(n) {
  return new Promise(resolve => {
    var subject = new Subject();
    var obs = subject.asObservable();

    var prevLayer = [obs];
    for (var i = 0; i < 10; i++) {
      var nextLayer = [];
      for (var j = 0; j < n; j++) {
        nextLayer.push(combineLatest(
          ...prevLayer,
          (...values) => values.reduce((s, x) => s + x)
        ));
      }
      prevLayer = nextLayer;
    }
    var lastObs = combineLatest(
      ...prevLayer,
      (...values) => values.reduce((s, x) => s + x)
    );
    
    var evalT0 = performance.now();
    lastObs.subscribe((x) => {
      var evalT = performance.now() - evalT0;
      resolve({
        eval: evalT,
      });
    });
    subject.next(1);
  });
}

function fullyConnectedLayers2x(n) {
  return new Promise(resolve => {
    var subject = new Subject();
    var obs = subject.asObservable();

    var prevLayer = [obs];
    for (var i = 0; i < 10; i++) {
      var nextLayer = [];
      for (var j = 0; j < n; j++) {
        nextLayer.push(combineLatest(
          ...prevLayer,
          (...values) => values.reduce((s, x) => s + x)
        ));
      }
      prevLayer = nextLayer;
    }
    var lastObs = combineLatest(
      ...prevLayer,
      (...values) => values.reduce((s, x) => s + x)
    );
    
    var evalT0 = performance.now();
    var secondTry = false;
    lastObs.subscribe((x) => {
      if (x === Math.pow(n, 10) && !secondTry) {
        secondTry = true;
        subject.next(2);
      } else if (x === 2 * Math.pow(n, 10)) {
        var evalT = performance.now() - evalT0;
        resolve({
          eval: evalT,
        });
      }
    });
    subject.next(1);
  });
}

function simpleSequence(n) {
  return new Promise(resolve => {
    var arr = [];
    for (var i = 0; i < n; i++) {
      arr.push(i);
    }

    var obs = from(arr);
    var lastObs = obs.pipe(map(x => x));
    var counter = 0;
    var evalT0 = performance.now();
    lastObs.subscribe(x => {
      counter++;
      if (counter === n) {
        var evalT = performance.now() - evalT0;
        resolve({
          eval: evalT,
        })
      }
    });
  });
}

function simpleTree(n) {
  return new Promise(resolve => {
    var subject = new Subject();
    var obs = subject.asObservable();

    var prevLayer = [obs];
    for (var i = 0; i < n; i++) {
      var nextLayer = [];
      for (var j = 0; j < prevLayer.length; j++) {
        for (var k = 0; k < 3; k++) {
          nextLayer.push(prevLayer[j].pipe(map(x => x)));
        }
      }
      prevLayer = nextLayer;
    }

    var evalT0;
    var counter = 0;
    for (var i = 0; i < prevLayer.length; i++) {
      prevLayer[i].subscribe(x => {
        counter++;
        if (counter === Math.pow(3, n)) {
          var evalT = performance.now() - evalT0;
          resolve({
            eval: evalT,
          })
        }
      });
    }
    
    var evalT0 = performance.now();
    subject.next(1);
  });
}
