import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const appId = "35c27e25ef06461aa0af5cc32cfce885";
const channelName = "test";
const token = null;

const ClassRoom = ({ role = "audience" }) => {
    const [joined, setJoined] = useState(false);
    const [localTracks, setLocalTracks] = useState([]);
    const clientRef = useRef(null);
    const localVideoRef = useRef();

    useEffect(() => {
        clientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

        clientRef.current.on("user-published", handleUserPublished);
        clientRef.current.on("user-unpublished", handleUserUnpublished);

        return () => {
            leaveChannel();
        };
    }, []);

    const handleUserPublished = async (user, mediaType) => {
        await clientRef.current.subscribe(user, mediaType);
        if (mediaType === "video") {
            const remoteVideo = document.createElement("div");
            remoteVideo.id = user.uid;
            remoteVideo.style.width = "300px";
            remoteVideo.style.height = "200px";
            document.getElementById("remote-streams").appendChild(remoteVideo);
            user.videoTrack.play(remoteVideo);
        }
        if (mediaType === "audio") {
            user.audioTrack.play(); // Audio for student
        }
    };

    const handleUserUnpublished = (user) => {
        const remoteVideo = document.getElementById(user.uid);
        if (remoteVideo) remoteVideo.remove();
    };

    const joinChannel = async () => {
        await clientRef.current.join(appId, channelName, token, null);
        await clientRef.current.setClientRole(role); // Set "host" or "audience"

        if (role === "host") {
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            setLocalTracks([audioTrack, videoTrack]);

            videoTrack.play(localVideoRef.current);
            await clientRef.current.publish([audioTrack, videoTrack]);
        }

        setJoined(true);
    };

    const leaveChannel = async () => {
        localTracks.forEach((track) => track.close());
        if (clientRef.current) {
            await clientRef.current.leave();
        }
        setJoined(false);
        setLocalTracks([]);
        const remoteContainer = document.getElementById("remote-streams");
        if (remoteContainer) remoteContainer.innerHTML = "";
    };

    return (
        <div>
            <div className="flex gap-4">
                {role === "host" && (
                    <div>
                        <h3 className="font-semibold">Your Video</h3>
                        <div
                            ref={localVideoRef}
                            className="h-[200px] w-[300px] bg-gray-300"
                        ></div>
                    </div>
                )}
                <div>
                    <h3 className="font-semibold">{role === "host" ? "Students" : "Teacher"}</h3>
                    <div
                        id="remote-streams"
                        className="flex flex-wrap gap-4"
                    ></div>
                </div>
            </div>
            <div className="mt-4">
                {!joined ? (
                    <button
                        onClick={joinChannel}
                        className="rounded bg-blue-500 px-4 py-2 text-white"
                    >
                        Join as {role === "host" ? "Teacher" : "Student"}
                    </button>
                ) : (
                    <button
                        onClick={leaveChannel}
                        className="rounded bg-red-500 px-4 py-2 text-white"
                    >
                        Leave
                    </button>
                )}
            </div>
        </div>
    );
};

export default ClassRoom;
