var net = require('net');
var client = new net.Socket();

var info = function(host, port, cmd, callback) {
    // error checking for all the arguments.
    client.connect(port, host, function() {
        // handle connection failure
        // form the network buffer with header and data in this.
        // Determine the size of buffer to be allocated
        var length = cmd.length;
        var terminator = cmd.charAt(length-1);
        if( terminator !== '\n'){
            cmd = cmd + '\n';
        }
        var size = cmd.length + 8;
        var buff = new Buffer(size);
        // first byte version
        // This flag is not honored by server. For values upto 7, it doesn't throw any error.
        buff.writeUInt8(2, 0);
        // second byte type
        buff.writeUInt8(1, 1);
        // next six bytes are length of content
        buff.writeUIntBE(cmd.length, 2, 6);
        // write the actual content
        buff.write(cmd, 8, cmd.length);
        client.write(buff);
        console.log('Connected');
    });
}

client.on('data', function(data) {
    // process the header and then read the content.
    if(data[0] !== 2) {
        // version mismatch
    }
    if(data[1] !== 1) {
        // type mismatch
    }
    var size = data.readUIntBE(2, 6);
    // get the bytes in LE order. Network order is BE.
    // Check the size for any possible errors.
    // 1. Size overflow error
    // 2. Size 0 error
    
    // For now just slice the heade
    if( size > 0) {
        var buff2 = data.slice(8,data.length);
        console.log('Received: ' + buff2);
    }
    else {
        console.log("No data received");
    }
    client.destroy(); // kill client after server's response
});

client.on('timeout', function() {
    console.log("connection timed out");
});

client.on('error', function(err) {
    console.log(err);
});
client.on('close', function() {
        console.log('Connection closed');
});

info("127.0.0.1", 3000, "objects");
//info("127.0.0.1", 3000, "random");
