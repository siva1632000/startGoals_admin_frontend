import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = "35c27e25ef06461aa0af5cc32cfce885"; // Replace with your Agora App ID
const CHANNEL = new URLSearchParams(window.location.search).get("channel") || "live-classroom";
const USER_ID = new URLSearchParams(window.location.search).get("uid") || `user_${Date.now()}`;
const IS_TEACHER = new URLSearchParams(window.location.search).get("role") === "teacher";

const rtc = {
    client: AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }),
    localAudioTrack: null,
    localVideoTrack: null,
};

const Classroom = () => {
    const [liveStarted, setLiveStarted] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);

    // Join the class and set up the event listeners
    const joinClass1 = async () => {
        try {
            await rtc.client.join(APP_ID, CHANNEL, null, USER_ID);

            // Create and publish local audio and video tracks
            const mic = await AgoraRTC.createMicrophoneAudioTrack();
            const cam = await AgoraRTC.createCameraVideoTrack();
            rtc.localAudioTrack = mic;
            rtc.localVideoTrack = cam;

            await rtc.client.publish([mic, cam]);

            setLiveStarted(true);

            const localVideoContainer = document.getElementById("local-video");
            if (localVideoContainer) {
                cam.play(localVideoContainer);
            }

            // Subscribe to remote user streams when they join
            rtc.client.on("user-published", async (user, mediaType) => {
                await rtc.client.subscribe(user, mediaType);

                // Handle video track (remote participants)
                if (mediaType === "video") {
                    const remoteContainer = document.createElement("div");
                    remoteContainer.id = `user-container-${user.uid}`;
                    remoteContainer.style.width = "100%";
                    remoteContainer.style.height = "240px";
                    remoteContainer.style.background = "#333";
                    remoteContainer.style.borderRadius = "12px";
                    remoteContainer.style.overflow = "hidden";
                    remoteContainer.style.display = "flex";
                    remoteContainer.style.justifyContent = "center";
                    remoteContainer.style.alignItems = "center";
                    document.getElementById("video-container").appendChild(remoteContainer);

                    if (user.videoTrack) {
                        user.videoTrack.play(remoteContainer);
                    }
                }

                // Add new participant's ID to the list
                setParticipants((prevParticipants) => [...prevParticipants, { id: user.uid }]);
            });

            // Remove participant from list when they leave
            // rtc.client.on("user-unpublished", (user) => {
            //     setParticipants((prevParticipants) => prevParticipants.filter((p) => p.id !== user.uid));
            // });

            rtc.client.on("user-unpublished", (user) => {
                const remoteContainer = document.getElementById(`user-container-${user.uid}`);
                if (remoteContainer) {
                    remoteContainer.remove(); // 🧹 Clean up DOM
                }
                setParticipants((prev) => prev.filter((p) => p.id !== user.uid));
            });

            rtc.client.on("user-left", (user) => {
                const remoteContainer = document.getElementById(`user-container-${user.uid}`);
                if (remoteContainer) {
                    remoteContainer.remove();
                }
                setParticipants((prev) => prev.filter((p) => p.id !== user.uid));
            });
        } catch (err) {
            console.error("Error joining class:", err);
        }
    };

    const joinClass = async () => {
        try {
            await rtc.client.join(APP_ID, CHANNEL, null, USER_ID);

            if (IS_TEACHER) {
                const mic = await AgoraRTC.createMicrophoneAudioTrack();
                const cam = await AgoraRTC.createCameraVideoTrack();
                rtc.localAudioTrack = mic;
                rtc.localVideoTrack = cam;

                await rtc.client.publish([mic, cam]);

                const localVideoContainer = document.getElementById("local-video");
                if (localVideoContainer) {
                    cam.play(localVideoContainer);
                }
            }

            setLiveStarted(true);

            // 🔔 Listen for anyone joining the room
            rtc.client.on("user-joined", (user) => {
                const existing = document.getElementById(`user-container-${user.uid}`);
                if (!existing) {
                    // const remoteContainer = document.createElement("div");
                    // remoteContainer.id = `user-container-${user.uid}`;
                    // remoteContainer.style.width = "100%";
                    // remoteContainer.style.height = "240px";
                    // remoteContainer.style.background = "#222";
                    // remoteContainer.style.borderRadius = "12px";
                    // remoteContainer.style.display = "flex";
                    // remoteContainer.style.justifyContent = "center";
                    // remoteContainer.style.alignItems = "center";
                    // remoteContainer.style.color = "white";
                    // remoteContainer.style.fontSize = "18px";
                    // remoteContainer.innerText = `👤 ${user.uid}`;
                    // document.getElementById("video-container").appendChild(remoteContainer)
                    //
                    // ;
                    const remoteContainer = document.createElement("div");
                    remoteContainer.id = `user-container-${user.uid}`;
                    remoteContainer.style.position = "relative";
                    remoteContainer.style.width = "100%";
                    remoteContainer.style.height = "240px";
                    remoteContainer.style.background = "#000";
                    remoteContainer.style.borderRadius = "12px";
                    remoteContainer.style.overflow = "hidden";

                    const userLabel = document.createElement("div");
                    userLabel.innerText = `👤 ${user.uid}`;
                    userLabel.style.position = "absolute";
                    userLabel.style.top = "8px";
                    userLabel.style.left = "8px";
                    userLabel.style.background = "rgba(0,0,0,0.6)";
                    userLabel.style.color = "#fff";
                    userLabel.style.padding = "4px 8px";
                    userLabel.style.borderRadius = "6px";
                    userLabel.style.fontSize = "14px";
                    userLabel.style.zIndex = "10";

                    // Append label and then video
                    remoteContainer.appendChild(userLabel);
                    document.getElementById("video-container").appendChild(remoteContainer);

                    // Only play video if track is available
                    if (user.videoTrack) {
                        user.videoTrack.play(remoteContainer);
                    }
                }

                setParticipants((prev) => {
                    const exists = prev.find((p) => p.id === user.uid);
                    return exists ? prev : [...prev, { id: user.uid }];
                });
            });

            rtc.client.on("user-published", async (user, mediaType) => {
                await rtc.client.subscribe(user, mediaType);

                // 📹 If teacher publishes video
                if (mediaType === "video" && user.videoTrack) {
                    user.videoTrack.play(`user-container-${user.uid}`);
                }

                setParticipants((prev) => {
                    const exists = prev.find((p) => p.id === user.uid);
                    return exists ? prev : [...prev, { id: user.uid }];
                });
            });

            rtc.client.on("user-unpublished", (user) => {
                const remoteContainer = document.getElementById(`user-container-${user.uid}`);
                if (remoteContainer) remoteContainer.remove();
                setParticipants((prev) => prev.filter((p) => p.id !== user.uid));
            });

            rtc.client.on("user-left", (user) => {
                const remoteContainer = document.getElementById(`user-container-${user.uid}`);
                if (remoteContainer) remoteContainer.remove();
                setParticipants((prev) => prev.filter((p) => p.id !== user.uid));
            });
        } catch (err) {
            console.error("Error joining class:", err);
        }
    };

    // Handle starting the live session (teacher only)
    const handleStartLive = async () => {
        if (IS_TEACHER) {
            await joinClass();
        } else {
            alert("Only the teacher can start the live session.");
        }
    };

    // Start screen sharing (only teacher)
    const handleScreenShare = async () => {
        if (IS_TEACHER) {
            if (!isScreenSharing) {
                const screenTrack = await AgoraRTC.createScreenVideoTrack();
                await rtc.client.unpublish([rtc.localVideoTrack]);
                await rtc.client.publish([screenTrack]);
                screenTrack.play("local-video");
                setIsScreenSharing(true);
            } else {
                await rtc.client.unpublish([rtc.localVideoTrack]);
                setIsScreenSharing(false);
            }
        }
    };

    // Handle student joining the class
    const handleJoinClass = async () => {
        await joinClass();
    };

    // 👇 Add this function inside the Classroom component
    const leaveClass = async () => {
        try {
            // Stop local audio/video tracks
            if (rtc.localAudioTrack) rtc.localAudioTrack.stop();
            if (rtc.localVideoTrack) rtc.localVideoTrack.stop();

            // Close local tracks
            if (rtc.localAudioTrack) rtc.localAudioTrack.close();
            if (rtc.localVideoTrack) rtc.localVideoTrack.close();

            // Leave the Agora channel
            await rtc.client.leave();

            // Clear participants and UI
            setParticipants([]);
            setLiveStarted(false);
            setIsScreenSharing(false);

            // Remove remote video containers
            const container = document.getElementById("video-container");
            if (container) container.innerHTML = "";

            const localVideo = document.getElementById("local-video");
            if (localVideo) localVideo.innerHTML = "";

            alert("You have left the class.");
        } catch (error) {
            console.error("Error leaving class:", error);
        }
    };

    const toggleMic = () => {
        if (rtc.localAudioTrack) {
            if (micOn) {
                rtc.localAudioTrack.setEnabled(false);
            } else {
                rtc.localAudioTrack.setEnabled(true);
            }
            setMicOn(!micOn);
        }
    };

    const toggleCamera = () => {
        if (rtc.localVideoTrack) {
            if (cameraOn) {
                rtc.localVideoTrack.setEnabled(false);
            } else {
                rtc.localVideoTrack.setEnabled(true);
            }
            setCameraOn(!cameraOn);
        }
    };

    return (
        <div className="dark mx-auto min-h-screen max-w-5xl space-y-6 bg-gray-900 p-6 text-white">
            <h2 className="text-center text-2xl font-bold">🔴 {liveStarted ? "Live Classroom" : "Waiting to Start"}</h2>

            <div className="flex flex-wrap justify-between gap-4">
                {!liveStarted ? (
                    IS_TEACHER ? (
                        <button
                            onClick={handleStartLive}
                            className="rounded bg-red-600 px-4 py-2 hover:bg-red-700"
                        >
                            🎥 Start Live (Teacher only)
                        </button>
                    ) : (
                        <button
                            onClick={handleJoinClass}
                            className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
                        >
                            📲 Join Room (Student only)
                        </button>
                    )
                ) : (
                    <>
                        {IS_TEACHER && (
                            <button
                                onClick={handleScreenShare}
                                className="rounded bg-blue-500 px-4 py-2 hover:bg-blue-600"
                            >
                                {isScreenSharing ? "🛑 Stop Sharing" : "📺 Share Screen"}
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={toggleMic}
                    className={`rounded px-4 py-2 ${micOn ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                >
                    {micOn ? "🎙️ Mute Mic" : "🔇 Unmute Mic"}
                </button>

                <button
                    onClick={toggleCamera}
                    className={`rounded px-4 py-2 ${cameraOn ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                >
                    {cameraOn ? "📷 Turn Off Camera" : "🎥 Turn On Camera"}
                </button>
            </div>

            {liveStarted && (
                <div className="mt-4">
                    <h4 className="font-semibold">📝 Participant IDs:</h4>
                    <ul className="list-inside list-disc text-sm">
                        {participants.map((p) => (
                            <li key={p.id}>{p.id}</li>
                        ))}
                    </ul>
                </div>
            )}

            {liveStarted && (
                <>
                    <button
                        onClick={leaveClass}
                        className="rounded bg-gray-700 px-4 py-2 hover:bg-gray-800"
                    >
                        🚪 Leave Class
                    </button>
                    <div>
                        <h4 className="mb-2 font-semibold">📹 Local Video</h4>
                        <div
                            id="local-video"
                            className="h-64 w-full rounded bg-black shadow-md"
                        ></div>
                    </div>

                    <div>
                        <h4 className="mb-2 font-semibold">👥 Remote Participants</h4>
                        <div
                            id="video-container"
                            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {/* Remote participant videos will be appended here */}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Classroom;
