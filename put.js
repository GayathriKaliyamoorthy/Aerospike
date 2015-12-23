var pool      = require('./connectionpool.js');
var profiler  = require('v8-profiler');
var crypto    = require('crypto');
var net       = require('net');
var client    = new net.Socket();
var req = 0;
var buftime = 0;
var totaltime = 'time';
var put = function( key, bins, metadata, writePolicy, callback) {
    profiler.startProfiling('', true);
    //console.time(buftime);
    var buf = new Buffer(2*1024);
    // write the header
    var offset = 8;
    buf[8] = 22;
    // read attribute
    offset++;
    buf[9] = 0;
    offset++;
    // write attribute
    buf[offset++] = 1 << 0 ;
    // info attribute
    buf[offset++] = 0;
    buf.writeUInt16BE(0 ,offset);
    offset += 2;
    buf.writeUInt32BE(metadata.gen, 14);
    offset += 4;
    buf.writeUInt32BE(metadata.ttl, 18);
    // timeout in millisecond
    offset += 4;
    buf.writeUInt32BE( writePolicy.timeout, 22)
    // number of fields in the key: ns, set, digest, key .
    offset += 4;
    buf.writeUInt16BE(4, 26);
    // number of bins.
    offset += 2;
    var numBins = Object.keys(bins).length;
    buf.writeUInt16BE( numBins, 28);
    offset += 2;
    // write the key
    // write namespace
    buf.writeUInt32BE(key.ns.length+1, offset);
    offset += 4;
    //write the ID for namespace
    buf[offset] = 0;
    offset += 1;
    // namespaec string
    buf.write(key.ns, offset, key.ns.length);
    offset += key.ns.length;
    // write set
    buf.writeUInt32BE(key.set.length+1, offset);
    // ID for set
    offset += 4;
    buf[offset] = 1;
    offset++;
    buf.write(key.set, offset, key.set.length);
    offset += key.set.length;
    var digest =  computeDigest(key);
    //console.log(digest);
    buf.writeUInt32BE(21, offset);
    offset += 4;
    buf[offset++] = 4;
    digest.copy(buf, offset, 0, 20);
    var buf3 = buf.slice(offset, offset+20);
    //console.log(buf3);
    offset += 20;
    var keylen = key.key.length;
    buf.writeUInt32BE( keylen+1, offset);
    offset += 4;
    // key id
    buf[offset++] = 2;
    buf.write(key.key, offset, key.key.length);
    offset += keylen;
    //console.log(key.key);
    for( key in bins) {
        offset = writeBin(buf, offset, key, bins[key]);
    }


    // length of message
    buf.writeUInt8(2,0);
    buf.writeUInt8(3,1);
    //console.log(offset-8);
    buf.writeUIntBE(offset-8, 2, 6);
    //console.log(buf);
    var buf2 = buf.slice(0, offset);
    //console.timeEnd(buftime);
    //console.log(callback);
    //console.time(totaltime);
    var conn = pool.getConnection(callback);
    //console.log("Connection received ");
    conn.write(buf2);
};

function handleWriteResponse(data, connection, callback) {
    //pool.putConnection(connection);
    //parsePutResponse(data);
    //callback(data);
    /*req++;
    //console.timeEnd(totaltime);
    if(req < 10) {
        //console.time(totaltime);
        generateSinglePut(req);
    }
    else if(req >= 10){
        var profile = profiler.stopProfiling('');
        require('fs').writeFileSync(__dirname + '/foo.cpuprofile', JSON.stringify(profile));
        profiler.deleteAllProfiles();
        process.exit(0);
    }*/
}
function writeBin( buf, offset, binName, binValue){
    buf.writeUInt32BE(binName.length + binValue.length + 4, offset);
    offset += 4;
    // AS_OPERATOR_WRITE - operator_type
    buf[offset++] = 2;

    //AS_BYTES_STRING val_type
    buf[offset++] = 3;

    // extra byte in the bin header
    buf[offset++] = 0;

    // bin name length
    buf[offset++] = binName.length;

    // write the bin name and bin value.
    buf.write(binName, offset, binName.length);
    offset += binName.length;
    buf.write(binValue, offset, binValue.length);
    offset += binValue.length;
    return offset;

}
function computeDigest(key) {
    // compute the digest using set and key.
    var size  = key.set.length + key.key.length + 1;
    var buff = new Buffer(size);
    var offset = 0;
    buff.write(key.set, offset, key.set.length);
    offset += key.set.length;
    buff.writeUInt8(3, offset++);
    buff.write(key.key, offset, key.key.length);
    offset += key.key.length;

    var RIPEMD160 = crypto.createHash('rmd160');
    RIPEMD160.update(buff);
    var d = RIPEMD160.digest();
    return d;
}

module.exports = {
    put : put
};

function generatePut(ind) {
    for (var i = ind; i < ind + 5; i++) {
        put({ns:'test', set:'demo', key:'test-key'+i}, {bin1:'bin1', bin2: 'bin2', bin3:'bin3'}, {gen:0, ttl:10000}, {timeout:10}, i);
    }
}


function generateSinglePut(ind) {
        put({ns:'test', set:'demo', key:'test-key'+ind}, {bin1:'bin1', bin2: 'bin2', bin3:'bin3'}, {gen:0, ttl:10000}, {timeout:10}, ind);
}
