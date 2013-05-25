/*jslint browser: true */
/*global $: false */
(function ($) {
    "use strict";
    var tel, incomingCall, call, camera, autoFocusSupported;

    function state(text) {
        $('#state').text(text);
    }

    state('START');
    tel = navigator.mozTelephony;
    state("TEL INIT");

    function initCamera() {
        var options, cams;

        state('ACQUIRING CAM');

        cams = navigator.mozCameras.getListOfCameras();
        options = {camera: cams[0]};

        state('CAMERAS: ' + cams.length);

        navigator.mozCameras.getCamera(options, function (cam) {
            camera = cam;
            state('GOTCAMERA');

            autoFocusSupported = camera.capabilities.focusModes.indexOf('auto') !== -1;
            state('GOTCAMERA: ' + (autoFocusSupported ? 'AUTOFOCUS ON' : 'AUTOFOCUS OFF'));
        });
    }

    function pictureTaken(blob) {
        state('PICTURE TAKEN');

        $('#state').after('<img src="data:image/jpeg;base64,' + window.btoa(blob));
    }

    function takePicture() {
        var options = {};

        options.fileFormat = 'jpeg';
        options.rotation = 0;
        options.position = null;
        options.pictureSize = camera.capabilities.pictureSizes[0];
        options.dateTime = Date.now() / 1000;

        state('TAKING PICTURE');

        if (autoFocusSupported) {
            camera.autoFocus(function () {
                camera.takePicture(options, pictureTaken, function () {
                    state('PIC FAILED AFTER AUTOFOCUS');
                });
            });
        } else {
            camera.takePicture(options, pictureTaken, function () {
                state('PICTURE FAILED');
            });
        }
    }

    // Receiving a call
    tel.onincoming = function (event) {
        incomingCall = event.call;

        // Events for that call
        incomingCall.onstatechange = function (event) {
            /*
                Possible values for state:
                "dialing", "ringing", "busy", "connecting", "connected",
                "disconnecting", "disconnected", "incoming"
            */
            state(event.state);
        };

        incomingCall.onconnected = function () {
            state("CONNECTED");

            call = incomingCall;
            incomingCall = null;
        };

        incomingCall.ondisconnected = function () {
            state("DISCONNECTED");

            call = null;
        };

        state("CALL FROM " + incomingCall.number);
    };

    $('#pickup').on('touchstart', function (e) {
        e.preventDefault();

        takePicture();

        if (incomingCall) {
            // Answer the call
            incomingCall.answer();
        }
    });

    $('#hangup').on('touchstart', function (e) {
        e.preventDefault();

        if (call) {
            // Disconnect a call
            call.hangUp();
        }
    });

    state("BOOTSTRAPPED");

    initCamera();
}($));
