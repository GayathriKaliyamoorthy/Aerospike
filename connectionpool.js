var net = require('net');
var pool = [];
var poolSize = 300;
var head = -1, tail = -1;
var currSize = 0;
var i = 0;

function getConnection(processData) {
    if(currSize > 0 ) {
        //console.log("Connection reused", head);
        head = (head+1)%poolSize;
        var conn = pool[head];
        currSize--;
        return conn; 
    }
    else {
        //console.log("Creating connection ", i++, head);
        var conn = createConnection();
        conn.on('data', function(data){
            //processData(data, conn, callback);
            putConnection(conn);
            processData(data);
        });
        conn.on('error', function(error){
            processError(error);
        });
        conn.on('end', function(){
            processEnd(conn);
        });
        return conn;
    }
}

function putConnection(conn) {
    if( currSize < poolSize) {
        //console.log("Connection released ", tail);
        tail = (tail+1)%poolSize;
        pool[tail] = conn;
        currSize++;
    }
    else {
        conn.end();
    }
 }

function createConnection() {
    var conn = new net.createConnection(3000, "127.0.0.1");
    return conn;
}

/*function processData(data, connection) {
    //handover the data returned to appropriate guy
    //response for a given request should invoke appropriate response handler.
    //Right now only write requests are generated. Call writeResponse handler.
}*/

function processError(error) {
    //handle all possible error here
}

function processEnd(connection) {
}

module.exports = {
    getConnection: getConnection,
    putConnection: putConnection
}


