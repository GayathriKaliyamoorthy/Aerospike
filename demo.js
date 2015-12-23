var Native     = require('./put.js')

var TPS        = 0;
var avgLatency = 0;

var config = { 
    hosts: [{
        addr: '127.0.0.1',
        port: 3000
    }]
}
var client = require('aerospike').client(config).connect(function(){});

var isNative = true;

var singlePut = 'profile1';
var multiPut  = 'profile100';
function writeToAs(key,
                   bins, 
                   metadata, 
                   writepolicy, 
                   callback, isNative) {
    if(isNative === true) {
        Native.put(key, bins, metadata, writepolicy, callback);
    }
    else {
        client.put(key, bins, metadata, writepolicy, callback);
    }

}
var req = 0;
var Gkey = { 
    ns: 'test',
    set: 'demo',
    key : 'keybase'
}
var keybase = 'keybase';

var bins = {
    bin1 : 'bin1',
    bin2 : 'bin2',
    bin3 : 'bin3'
}

var metadata = {
    gen: 0,
    ttl: 10000
}

var writepolicy = {
    timeout : 10
}

function putCallback() {
    TPS++;
    
    // check for error here
    req = (req+1)%100000;
        Gkey.key = keybase + req;
        writeToAs(Gkey, bins, metadata, writepolicy, putCallback, isNative);
}

function generateLoad() {
    console.time(multiPut);
    for( var i = 0; i  < 100; i++) {
        Gkey.key = keybase  + i;
        writeToAs(Gkey, bins, metadata, writepolicy, putCallback, isNative);
    }
   
}

setInterval(function() {
    // print TPS
    console.log("Write TPS = ", TPS);
    TPS = 0;
    // print average latency
    //console.log("Average Latency = ", avgLatency);
    avgLatency = 0;
}, 1000);
generateLoad();
