export const createPeerConnection = () => {
  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });

  return peer;
};

export const replaceVideoTrack = async (peerConnection, newTrack) => {
  const sender = peerConnection
    .getSenders()
    .find((s) => s.track && s.track.kind === 'video');

  if (sender) {
    await sender.replaceTrack(newTrack);
  }
};

export const getVideoSender = (peerConnection) => {
  return peerConnection
    .getSenders()
    .find((s) => s.track && s.track.kind === 'video');
};

export const addTrackToPeerConnection = (peerConnection, track, stream) => {
  try {
    peerConnection.addTrack(track, stream);
  } catch (error) {
    console.error('Error adding track to peer connection:', error);
  }
};
