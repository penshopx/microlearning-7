import { useEffect, useRef, useState, useCallback } from "react";
import { meetingService } from "@/services/meetingService";

interface Participant {
  userId: string;
  displayName: string;
  stream?: MediaStream;
  isCameraOn: boolean;
  isMicOn: boolean;
}

export function useWebRTC(meetingId: string, userId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(configuration);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      remoteStreamsRef.current.set(peerId, stream);
      
      setParticipants((prev) => {
        const newMap = new Map(prev);
        const participant = newMap.get(peerId);
        if (participant) {
          participant.stream = stream;
          newMap.set(peerId, participant);
        }
        return newMap;
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        meetingService.sendSignal({
          meeting_id: meetingId,
          from_user_id: userId,
          to_user_id: peerId,
          signal_type: "ice-candidate",
          signal_data: event.candidate.toJSON() as any
        });
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [meetingId, userId]);

  // Create and send offer
  const createOffer = useCallback(async (peerId: string) => {
    const pc = createPeerConnection(peerId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await meetingService.sendSignal({
        meeting_id: meetingId,
        from_user_id: userId,
        to_user_id: peerId,
        signal_type: "offer",
        signal_data: offer as any
      });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }, [meetingId, userId, createPeerConnection]);

  // Handle incoming offer
  const handleOffer = useCallback(async (peerId: string, offer: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection(peerId);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      await meetingService.sendSignal({
        meeting_id: meetingId,
        from_user_id: userId,
        to_user_id: peerId,
        signal_type: "answer",
        signal_data: answer as any
      });
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }, [meetingId, userId, createPeerConnection]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (peerId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (peerId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        
        await meetingService.updateParticipantStatus(meetingId, userId, {
          is_camera_on: videoTrack.enabled
        });
      }
    }
  }, [meetingId, userId]);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        
        await meetingService.updateParticipantStatus(meetingId, userId, {
          is_mic_on: audioTrack.enabled
        });
      }
    }
  }, [meetingId, userId]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track in all peer connections
      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
      await meetingService.updateParticipantStatus(meetingId, userId, {
        is_screen_sharing: true
      });
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  }, [meetingId, userId]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      // Replace screen track back to camera track
      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });

      setIsScreenSharing(false);
      await meetingService.updateParticipantStatus(meetingId, userId, {
        is_screen_sharing: false
      });
    }
  }, [meetingId, userId]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
  }, []);

  // Get composite stream for recording (all participants)
  const getCompositeStream = useCallback((): { videoStream: MediaStream | null; audioContext: AudioContext | null; allStreams: MediaStream[] } => {
    const allStreams: MediaStream[] = [];
    
    // Add local stream
    if (localStreamRef.current) {
      allStreams.push(localStreamRef.current);
    }
    
    // Add all remote streams
    remoteStreamsRef.current.forEach((stream) => {
      allStreams.push(stream);
    });

    // Create audio context for mixing
    let audioContext: AudioContext | null = null;
    if (allStreams.length > 0 && allStreams.some(s => s.getAudioTracks().length > 0)) {
      audioContext = new AudioContext();
    }

    return { videoStream: localStreamRef.current, audioContext, allStreams };
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    participants,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    initializeLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleCamera,
    toggleMic,
    startScreenShare,
    stopScreenShare,
    setParticipants,
    getCompositeStream,
    cleanup
  };
}