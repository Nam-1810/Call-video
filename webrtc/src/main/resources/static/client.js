//connecting to our signaling server 
var conn = new WebSocket('wss://172.29.77.8:8443/socket');



conn.onopen = function() {

    initialize();
};

conn.onerror = error => {
    console.log(`An error occured: ${error}`)
};

conn.onmessage = function(msg) {
    var content = JSON.parse(msg.data);
    var data = content.data;
    console.log("Got message", content.data);
    switch (content.event) {
        // when somebody wants to call us
        case "offer":
            handleOffer(data);
            break;
        case "answer":
            handleAnswer(data);
            break;
        // when a remote peer sends an ice candidate to us
        case "candidate":
            handleCandidate(data);
            break;
        default:
            break;
    }
};

function send(message) {
    conn.send(JSON.stringify(message));
}

var peerConnection;
var dataChannel;
var input = document.getElementById("messageInput");

function initialize() {
    console.log("Connected to the signaling server");

    var configuration = {
        "iceServers": [{
            "url": "stun:stun.l.google.com:19302"
        }]
    };

    peerConnection = new RTCPeerConnection(configuration);

    // Setup ice handling
    peerConnection.onicecandidate = function(event) {
        if (event.candidate) {
            send({
                event: "candidate",
                data: event.candidate
            });
        }
    };


    // creating data channel
    dataChannel = peerConnection.createDataChannel("dataChannel", {
        reliable: true
    });

    dataChannel.onerror = function(error) {
        console.log("Error occured on datachannel:", error);
    };

    // when we receive a message from the other peer, printing it on the console
    dataChannel.onmessage = function(event) {
        console.log("message:", event.data);
    };

    dataChannel.onclose = function() {
        console.log("data channel is closed");
    };

    peerConnection.ondatachannel = function(event) {
        dataChannel = event.channel;
    };

}

function createOffer() {
    peerConnection.createOffer(function(offer) {
        send({
            event: "offer",
            data: offer
        });
        peerConnection.setLocalDescription(offer);
    }, function(error) {
        alert("Error creating an offer");
    });
}

function handleOffer(offer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // create and send an answer to an offer
    peerConnection.createAnswer(function(answer) {
        peerConnection.setLocalDescription(answer);
        send({
            event: "answer",
            data: answer
        });
    }, function(error) {
        alert("Error creating an answer");
    });

};

function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

function handleAnswer(answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("connection established successfully!!");
};

function sendMessage() {
    switch (dataChannel.readyState) {
        case "connecting":
            console.log(`Connection not open; queueing: "hi"`);
            break;
        case "open":
            dataChannel.send("hi Nam");
            break;
        case "closing":
            console.log(`Attempted to send message while closing: "hi"`);
            break;
        case "closed":
            console.log("Error! Attempt to send while connection closed.");
            break;
    }
}