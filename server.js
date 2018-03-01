const express = require('express');
let bodyParser=require('body-parser');

const app=express();
const http = require('http').Server(app);
let port=5000||process.env.PORT;
const io = require('socket.io')(http);
//let db = require('./db/db');
const passport=require('passport');
const LocalStrategy=require('passport-local').Strategy;
const session=require('express-session');
const cookieParser=require('cookie-parser');
const userconfig=require('./userconfig.json');
let bcrypt = require('bcrypt');
const saltRounds = 10;
const someOtherPlaintextPassword = 'not_bacon';
const path=require('path');
let un,pw;

app.set('views', path.join(__dirname, 'view1'));
app.set('views engine', 'hbs');



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use('/', express.static('public'));
//app.use(express.static(path.join(__dirname, 'public1')));

app.use(cookieParser());
app.use(session({secret:'cat is here'}));
app.use(passport.initialize());
app.use(passport.session());

/*app.get('/login',function () {
    res.render('login.hbs');
});*/

let users = [];
let connections = [];

io.on('connection',function(socket) {
    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
    socket.on('radio', function (blob) {
        // can choose to broadcast it to whoever you want
        socket.broadcast.emit('voice', blob);
    })
    socket.on('new user',function(data ,callback){
        callback(true);
        socket.username = data;
        users.push(socket.username);
    })
    socket.on('doubt',function(data ,callback) {
        callback(true);
    });
});

io.on('connect',function(socket){
    connections.push(socket);
    console.log(`Connected : ${connections.length} students are present.`);

    socket.on('disconnect',function(data){
        users.splice(users.indexOf(socket.username),1)
        updateUsernames();
        connections.splice(connections.indexOf(socket),1);
        console.log(`Disconnected : ${connections.length} students present now`)
    })

    socket.on('send message',function(data){
        io.sockets.emit('new message',{msg : data, user : socket.username});
    })

    socket.on('new user',function(data ,callback){
        callback(true);
        socket.username = data;
        users.push(socket.username);
        updateUsernames();
    })

    function updateUsernames(){
        io.sockets.emit('get users',users);
    }
});

app.post('/login',
    passport.authenticate('local',
        { successRedirect: '/success',
            failureRedirect: '/' }));

passport.use(new LocalStrategy(

    function (username,password,done) {
        console.log(username);
        console.log(userconfig);
        if(username !== userconfig.username ) {

            return done(null, false, {message: "Username is not valid"});

        }

        if(password !== userconfig.password) {
            return done(null, false, {message: "Password is incorrect"});
        }

        return done(null, userconfig);
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(id,done) {
    done(null,id);
});

/*app.post('/signup',function (req,res) {

    var username=req.body.username;
    var password=req.body.password;
    /*bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            db.add(username,hash,function (data) {
                console.log(data);
            });
        });
    });
    db.add(username,password,function (data) {
        console.log(data);
    });

    res.sendFile('sd.html', {root : __dirname + '/public'});

});*/

app.get('/log',function (req,res) {
    res.send("Hello")
});

app.get('/success',function (req,res) {

    res.sendFile('sd.html', {root : __dirname + '/public'});
});

http.listen(port,function () {
    console.log("Server is running on port "+port);
    //db.connect();
});

