import { Subject, of, combineLatest, subscribe } from 'rxjs';
import { map } from 'rxjs/operators';

var testsFunctions = {
  simpleChain: config => config.size.map(size => () => simpleChain(size)),
  fullyConnectedLayers: config => config.size.map(size => () => fullyConnectedLayers(size)),
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
    resolve({
      construct: constructT,
      // eval: evalT,
    });
    obs.subscribe(() => {
      var evalT = performance.now() - evalT0;
      resolve({
        construct: constructT,
        eval: evalT,
      });
    });
    // subject.next(1);
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
      console.log(x);
      var evalT = performance.now() - evalT0;
      resolve({
        eval: evalT,
      });
    });
    subject.next(1);
  });
}
