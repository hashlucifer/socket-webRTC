let isAlreadyCalling = false;
let getCalled = true;

const existingCalls = [];

const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection();

function unselectUsersFromList() {
    const alreadySelectedUser = document.querySelectorAll(
        ".active-user.active-user--selected"
    );

    alreadySelectedUser.forEach(el => {
        el.setAttribute("class", "active-user");
    });
}

function createUserItemContainer(socketId) {
    const userContainerEl = document.createElement("div");

    const usernameEl = document.createElement("p");

    userContainerEl.setAttribute("class", "active-user");
    userContainerEl.setAttribute("id", socketId);
    usernameEl.setAttribute("class", "username");
    usernameEl.innerHTML = `Socket: ${socketId}`;

    userContainerEl.appendChild(usernameEl);

    userContainerEl.addEventListener("click", () => {
        unselectUsersFromList();
        userContainerEl.setAttribute("class", "active-user active-user--selected");
        const talkingWithInfo = document.getElementById("talking-with-info");
        talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
        callUser(socketId);
    });

    return userContainerEl;
}

async function callUser(socketId) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    console.log("Calling user");
    socket.emit("call-user", {
        offer: peerConnection.localDescription,
        to: socketId
    });
}

function updateUserList(socketIds) {
    const activeUserContainer = document.getElementById("active-user-container");

    socketIds.forEach(socketId => {
        const alreadyExistingUser = document.getElementById(socketId);
        if (!alreadyExistingUser) {
            const userContainerEl = createUserItemContainer(socketId);

            activeUserContainer.appendChild(userContainerEl);
        }
    });
}

const socket = io.connect(window.location.href);

socket.on("update-user-list", ({ users }) => {
    updateUserList(users);
});

socket.on("remove-user", ({ socketId }) => {
    const elToRemove = document.getElementById(socketId);

    if (elToRemove) {
        elToRemove.remove();
    }
});

socket.on("call-made", async data => {
    if (getCalled) {
        const confirmed = confirm(
            `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
        );

        if (!confirmed) {
            socket.emit("reject-call", {
                from: data.socket
            });

            return;
        }
        console.log("Call-made")
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
        console.log("Making Answer");
        socket.emit("make-answer", {
            answer: peerConnection.localDescription,
            to: data.socket
        });
        getCalled = false;
    }
});

socket.on("answer-made", async data => {
    if (!isAlreadyCalling) {
        // callUser(data.socket);
        await peerConnection.setRemoteDescription(data.answer);
        console.log("answer-made")
        isAlreadyCalling = true;
    }
});

socket.on("call-rejected", data => {
    alert(`User: "Socket: ${data.socket}" rejected your call.`);
    unselectUsersFromList();
});

peerConnection.ontrack = function (ev) {
    // const remoteVideo = document.getElementById("remote-video");
    // if (remoteVideo) {
    //     if (remoteView.srcObject) return;
    //     console.log('REMOTE VIDEO STARTED', event, event.streams);
    //     remoteVideo.srcObject = event.streams[0];
    // }

    if (ev.streams && ev.streams[0]) {
        remoteVideo.srcObject = ev.streams[0];
    } else {
        let inboundStream = new MediaStream(ev.track);
        remoteVideo.srcObject = inboundStream;
    }
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    const localVideo = document.getElementById("local-video");
    if (localVideo) {
        localVideo.srcObject = stream;
    }
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
}).catch(error => {
    console.error(error.message);
})
