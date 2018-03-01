var mysql = require('mysql');

var config = {
    host: 'localhost',
    user: 'kawal',
    password: '',
    database: 'tasks'
};


var connection = mysql.createConnection(config);

function Connect() {
    connection.connect();
}

function display(id,query,callback) {

    connection.query('Select '+query+' FROM userdata where id='+id, function(err,data) {

        callback(data);
    });
}


function add(username, password, callback) {
    console.log(username, password);
    connection.query('insert into userdata (username,password) values (\''+username+'\',\''+password+'\');', function(data) {
        callback(data);
    })
}

function isEqualuser(username,callback) {
    console.log(username);
    connection.query('select username,id from userdata where username="'+username+'";',function (err,data) {
       // console.log(data[0].username);
        data=JSON.stringify(data);
        console.log(data);
        data=JSON.parse(data);
        console.log(data);
        callback(data[0].username,data[0].id);
    })
}

function isEqualpass(id,password,callback) {
    console.log(password);
    connection.query('select password from userdata where id='+id,function (err,data) {
        console.log(data[0].password);
        data=JSON.stringify(data);
        console.log(data);
        data=JSON.parse(data);
        console.log(data);
        callback(data[0].password);
    })
}


module.exports = {
    connect: Connect,
    display: display,
    add: add,
    isEqualuser:isEqualuser,
    isEqualpass:isEqualpass
};