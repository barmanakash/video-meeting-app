/**
 * Screen Sharing Service
 * Handles capturing and managing screen share streams
 */

export const startScreenShare = async (): Promise<MediaStream> => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    return screenStream;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Screen sharing was cancelled');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No screen or window found to share');
    }
    throw error;
  }
};

export const stopScreenShare = (stream: MediaStream): void => {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};

export const getScreenTrack = (stream: MediaStream): MediaStreamTrack | null => {
  const videoTracks = stream.getVideoTracks();
  return videoTracks.length > 0 ? videoTracks[0] : null;
};

export const replaceVideoTrack = async (
  peerConnection: RTCPeerConnection,
  newTrack: MediaStreamTrack
): Promise<void> => {
  const sender = peerConnection
    .getSenders()
    .find((s) => s.track && s.track.kind === 'video');

  if (sender) {
    await sender.replaceTrack(newTrack);
  }
};
