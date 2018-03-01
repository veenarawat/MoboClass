'use strict';

(function() {

    var socket = io();
    var canvas = document.getElementsByClassName('whiteboard')[0];
    var colors = document.getElementsByClassName('color');
    var context = canvas.getContext('2d');

    var current = {
        color: 'black'
    };
    var drawing = false;

    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

    for (var i = 0; i < colors.length; i++){
        colors[i].addEventListener('click', onColorUpdate, false);
    }

    socket.on('drawing', onDrawingEvent);

    window.addEventListener('resize', onResize, false);
    onResize();


    function drawLine(x0, y0, x1, y1, color, emit){
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.stroke();
        context.closePath();

        if (!emit) { return; }
        var w = canvas.width;
        var h = canvas.height;

        socket.emit('drawing', {
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            color: color
        });
    }

    function onMouseDown(e){
        drawing = true;
        current.x = e.clientX;
        current.y = e.clientY;
    }

    function onMouseUp(e){
        if (!drawing) { return; }
        drawing = false;
        drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    }

    function onMouseMove(e){
        if (!drawing) { return; }
        drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
        current.x = e.clientX;
        current.y = e.clientY;
    }

    function onColorUpdate(e){
        current.color = e.target.className.split(' ')[1];
    }

    // limit the number of events per second
    function throttle(callback, delay) {
        var previousCall = new Date().getTime();
        return function() {
            var time = new Date().getTime();

            if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }

    function onDrawingEvent(data){
        var w = canvas.width;
        var h = canvas.height;
        drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    }

    // make the canvas fill its parent
    function onResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    //RECORDER FUNCTIONING

    var constraints = { audio: true };
    let start = document.getElementById('start');
    let pause = document.getElementById('pause');
    let control = document.getElementById('control');
    navigator.mediaDevices.getUserMedia(constraints).then(function(mediaStream) {
        var mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.onstart = function(e) {
            this.chunks = [];
        };
        mediaRecorder.ondataavailable = function(e) {
            this.chunks.push(e.data);
        };
        mediaRecorder.onstop = function(e) {
            var blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
            socket.emit('radio', blob);
        };

        // Start recording
        start.onclick = function(){
            mediaRecorder.start();
            start.style.background = "#ff6666";
            start.style.color = "black";
            pause.style.background = "";
            pause.style.color = "";
        }

        // Stop recording and broadcast it to server
        pause.onclick = function()
        {
            mediaRecorder.stop()
            start.style.background = "";
            start.style.color = "";
            pause.style.background = "#ff6666";
            pause.style.color = "black";
        }
    });

// When the client receives a voice message it will play the sound
    socket.on('voice', function(arrayBuffer) {
        var blob = new Blob([arrayBuffer], { 'type' : 'audio/ogg; codecs=opus' });
        var audio = document.createElement('audio');
        audio.src = window.URL.createObjectURL(blob);
        audio.play();
    });

    var $userFormArea = $('#userFormArea');
    var $userForm = $('#userForm');
    var $username = $('#username');
    var $startbtn = $('#start');
    var $pausebtn = $('#pause');
    var $controlbtn = $('#control');
    var $doubtbtn = $('#doubt');
    var $clearbtn = $('#clear');
    var $topicbtn = $('#topic');
    var $container = $('#container');
    var $userForm = $('#userForm');

    $userForm.submit(function(e){
        e.preventDefault();
        socket.emit('new user', $username.val(),function(data){
           if(data){
                $userFormArea.hide();
                $container.show();
            }
            if($username.val()==="teacher")
            {

                $topicbtn.show();
                $startbtn.show();
                $pausebtn.show();
                $controlbtn.show();
                $doubtbtn.hide();
            }
            else
            {
                $startbtn.hide();
                $pausebtn.hide();
                $controlbtn.hide();
                $doubtbtn.show();
            }
        });

      // $username.val('');
    })

    $doubtbtn.click(function(){

        socket.emit('doubt',$username.val(),function(data){
            if(data){
                $startbtn.show();
                $pausebtn.show();
                $clearbtn.show();
                $doubtbtn.hide();
            }});
        $clearbtn.click(function(){
            $clearbtn.css('background-color', '#ccff66');
            $doubtbtn.show();
            $startbtn.hide();
            $pausebtn.hide();
            $clearbtn.hide();
        });
    });
    $topicbtn.click(function() {
        var val ="";
        var $topicop = $('#topicop');//topicop is topic output
        var $topicbox = $('#entertopic');
        var $back = $('#back');
        $topicbox.show();
        $back.show();
        val += '<h1 style="color:#cec0c0;">'+ $topicbox.val()+'</h1>';
        $back.click(function() {
              $topicop.html(val);
              socket.on('update',function(data){
                  $topicop.html(data);
              });
              $topicbox.hide();
              $back.hide();
        });
    });
})();