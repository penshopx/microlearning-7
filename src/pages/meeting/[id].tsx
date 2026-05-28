import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
  PhoneOff, Users, MessageSquare, Copy, Check, Send, Circle,
  UserPlus, Mail, Link as LinkIcon, Share2
} from "lucide-react";
import { meetingService } from "@/services/meetingService";
import { authService } from "@/services/authService";
import { subscriptionService } from "@/services/subscriptionService";
import { ctaService } from "@/services/ctaService";
import { meetingIntegrationService } from "@/services/meetingIntegrationService";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";

export default function MeetingRoom() {
  const router = useRouter();
  const { id: meetingCode } = router.query;
  const { toast } = useToast();
  
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string | null; name: string } | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [joinName, setJoinName] = useState("");
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: Powerful features states
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("grid");
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [reactions, setReactions] = useState<Map<string, { emoji: string; timestamp: number }>>(new Map());
  const [meetingLocked, setMeetingLocked] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState<any[]>([]);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [isPipMode, setIsPipMode] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Advanced audio/video features
  const [isBackgroundBlurred, setIsBackgroundBlurred] = useState(false);
  const [isNoiseSuppressed, setIsNoiseSuppressed] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("");
  const [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  const [showQA, setShowQA] = useState(false);

  // Live Sales CTA states
  const [showCTAPanel, setShowCTAPanel] = useState(false);
  const [showCTAForm, setShowCTAForm] = useState(false);
  const [activeCTA, setActiveCTA] = useState<any>(null);
  const [ctaList, setCtaList] = useState<any[]>([]);
  
  // Studio Mode states
  const [isStudioMode, setIsStudioMode] = useState(false);
  const [isOriginalSound, setIsOriginalSound] = useState(false);

  // Meeting limits and monetization
  const [meetingLimits, setMeetingLimits] = useState<{
    shouldEnd: boolean;
    reason?: "duration" | "participants";
    timeRemaining?: number;
    maxDuration?: number;
    maxParticipants?: number;
    isPro?: boolean;
  } | null>(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // WebRTC hook will be initialized once we have meetingId and userId
  const {
    localStream,
    participants: rtcParticipants,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    initializeLocalStream,
    toggleCamera,
    toggleMic,
    startScreenShare,
    stopScreenShare,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    getCompositeStream,
    cleanup
  } = useWebRTC(meetingId || "", currentUser?.id || "");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositeStreamRef = useRef<MediaStream | null>(null);

  // Initial setup: Validate meeting code and check user session
  useEffect(() => {
    if (!meetingCode || typeof meetingCode !== "string") return;
    let cancelled = false;

    const setupMeeting = async () => {
      try {
        console.log("Setting up meeting with code:", meetingCode);
        
        // 1. Check user session first
        const { userId, displayName, isGuest } = await authService.getUserInfo();
        console.log("User info:", { userId, displayName, isGuest });
        
        if (cancelled) return;
        
        if (userId || displayName) {
          setCurrentUser({ id: userId, name: displayName });
          if (userId && displayName) {
            // Check if stored guest ID is valid UUID if it's a guest
            if (isGuest && !isValidUUID(userId)) {
              // Invalid UUID format for guest, clear it
              authService.clearGuestUser();
              setCurrentUser(null);
            } else {
              setJoinName(displayName);
            }
          }
        }

        // 2. Get or create meeting
        // Fetch meeting details
        const { data: meetingData, error: meetingError } = await supabase
          .from("meetings")
          .select("*")
          .eq("meeting_code", meetingCode)
          .eq("is_active", true)
          .maybeSingle(); // Use maybeSingle() to handle missing meetings gracefully

        if (cancelled) return;
        let meeting = meetingData;
        
        if (meetingError || !meeting) {
          console.log("Meeting not found, creating new one...");
          // Auto-create meeting if not found, using the URL code as the meeting_code
          const { data: newMeeting, error: createError } = await meetingService.createMeeting(
            userId || null,
            `Chaesa Live - ${meetingCode}`,
            meetingCode
          );
          
          if (createError || !newMeeting) {
            console.error("Failed to create meeting:", createError);
            toast({
              title: "Error",
              description: "Tidak bisa membuat meeting. Silakan coba lagi.",
              variant: "destructive"
            });
            return;
          }
          
          meeting = newMeeting;
          console.log("New meeting created:", meeting);
        }

        setMeetingId(meeting.id);
        console.log("Meeting ID set:", meeting.id);
        
      } catch (error) {
        console.error("Error setting up meeting:", error);
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat memuat meeting",
          variant: "destructive"
        });
      }
    };

    setupMeeting();
    return () => { cancelled = true; };
  }, [meetingCode]);

  // Helper to validate UUID
  const isValidUUID = (uuid: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  };

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Subscribe to signals and participants when joined
  useEffect(() => {
    if (!isJoined || !meetingId || !currentUser?.id) return;

    // Initialize media
    initializeLocalStream();

    // Subscribe to participants
    const participantsSub = meetingService.subscribeToParticipants(meetingId, (payload) => {
      loadParticipants();
      
      // Handle new participant for WebRTC
      if (payload.eventType === "INSERT" && payload.new.user_id !== currentUser.id) {
        // New participant joined, initiate connection if I'm already here
        // We add a small delay to ensure they are ready
        setTimeout(() => createOffer(payload.new.user_id), 1000);
      }
    });

    // Subscribe to WebRTC signals
    const signalsSub = meetingService.subscribeToSignals(meetingId, currentUser.id, (signal) => {
      const { from_user_id, signal_type, signal_data } = signal;
      
      switch (signal_type) {
        case "offer":
          handleOffer(from_user_id, signal_data);
          break;
        case "answer":
          handleAnswer(from_user_id, signal_data);
          break;
        case "ice-candidate":
          handleIceCandidate(from_user_id, signal_data);
          break;
      }
    });

    // Subscribe to chat
    const chatSub = meetingService.subscribeToChatMessages(meetingId, (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Subscribe to Live Sales CTA
    const ctaSub = ctaService.subscribeToMeetingCTAs(
      meetingId,
      (cta) => {
        setActiveCTA(cta);
        toast({
          title: "🛍️ Special Offer!",
          description: cta.title,
          duration: cta.duration_seconds ? cta.duration_seconds * 1000 : 30000,
        });
        
        // Auto-hide after duration
        if (cta.duration_seconds) {
          setTimeout(() => {
            setActiveCTA(null);
          }, cta.duration_seconds * 1000);
        }
      },
      () => {
        setActiveCTA(null);
      }
    );

    // Initial load
    loadParticipants();
    loadMessages();

    return () => {
      participantsSub.unsubscribe();
      signalsSub.unsubscribe();
      chatSub.unsubscribe();
      ctaSub.unsubscribe();
      cleanup();
      meetingService.leaveMeeting(meetingId, currentUser.id);
    };
  }, [isJoined, meetingId, currentUser?.id]);

  const loadParticipants = async () => {
    if (!meetingId) return;
    const { data } = await meetingService.getParticipants(meetingId);
    if (data) setParticipants(data);
  };

  const loadMessages = async () => {
    if (!meetingId) return;
    const { data } = await meetingService.getChatMessages(meetingId);
    if (data) setMessages(data);
  };

  // Toggle Studio Mode (Hide all UI for clean OBS capture)
  const toggleStudioMode = () => {
    setIsStudioMode(!isStudioMode);
    toast({
      title: isStudioMode ? "Studio Mode Off" : "Studio Mode On",
      description: isStudioMode 
        ? "UI controls restored" 
        : "Clean layout for streaming. Press Ctrl+Shift+S to toggle",
    });
  };

  // Toggle Original Sound (Disable audio processing for OBS/Music)
  const toggleOriginalSound = () => {
    setIsOriginalSound(!isOriginalSound);
    
    // Apply audio constraints
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.applyConstraints({
          echoCancellation: !isOriginalSound,
          noiseSuppression: !isOriginalSound,
          autoGainControl: !isOriginalSound,
        });
      }
    }
    
    toast({
      title: isOriginalSound ? "Original Sound Off" : "Original Sound On",
      description: isOriginalSound 
        ? "Audio processing enabled (better for voice)" 
        : "Audio processing disabled (better for music/OBS)",
    });
  };

  // Handle CTA click
  const handleCTAClick = async (ctaId: string) => {
    await ctaService.recordClick(ctaId);
    
    if (activeCTA?.link_url) {
      window.open(activeCTA.link_url, "_blank");
    }
  };

  const handleJoin = async () => {
    try {
      console.log("Attempting to join meeting...", { meetingId, joinName, currentUser });
      
      // Auto-generate guest name if empty
      let finalName = joinName.trim();
      if (!finalName) {
        finalName = `Guest ${Math.random().toString(36).substring(2, 8)}`;
        setJoinName(finalName);
      }
      
      if (!meetingId) {
        toast({
          title: "Error",
          description: "Meeting ID tidak ditemukan. Silakan refresh halaman.",
          variant: "destructive"
        });
        return;
      }

      let userId = currentUser?.id;

      // If no user ID (new guest), create one
      if (!userId) {
        console.log("Creating guest user...");
        try {
          const { guestUserId, error } = await authService.createGuestUser(finalName);
          if (!error && guestUserId) {
            userId = guestUserId;
            authService.setGuestUser(userId, finalName);
            console.log("Guest user created in DB:", userId);
          } else {
            console.warn("DB guest creation failed, using local UUID:", error);
            userId = crypto.randomUUID();
            authService.setGuestUser(userId, finalName);
            console.log("Guest user created locally:", userId);
          }
        } catch (guestError) {
          console.warn("Guest creation error, using local UUID:", guestError);
          userId = crypto.randomUUID();
          authService.setGuestUser(userId, finalName);
        }
      }

      setCurrentUser({ id: userId, name: finalName });

      // Join meeting in DB
      console.log("Joining meeting in DB...", { meetingId, userId, finalName });
      try {
        await meetingService.joinMeeting(meetingId, userId, finalName);
      } catch (joinError) {
        console.warn("DB join failed, continuing locally:", joinError);
      }
      
      console.log("Successfully joined meeting!");
      setIsJoined(true);
      
      toast({
        title: "Berhasil Bergabung!",
        description: `Selamat datang ${finalName}`,
      });
      
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast({
        title: "Error Joining",
        description: "Tidak bisa join meeting. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !meetingId || !currentUser?.id) return;

    await meetingService.sendChatMessage(meetingId, currentUser.id, newMessage);
    setNewMessage("");
  };

  const copyMeetingCode = () => {
    if (!meetingCode) return;
    navigator.clipboard.writeText(meetingCode as string);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Meeting code copied to clipboard",
    });
  };

  const getMeetingLink = () => {
    if (!meetingCode) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/meeting/${meetingCode}`;
  };

  const safeCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    }
  };

  const copyMeetingLink = async () => {
    if (!meetingCode) return;
    await safeCopyToClipboard(getMeetingLink());
    setInviteLinkCopied(true);
    toast({ title: "Link disalin!" });
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  const inviteViaWhatsApp = () => {
    if (!meetingCode) return;
    const text = `🎬 *Gabung Live Meeting di Chaesa Live!*\n\n🔗 Klik link berikut:\n${getMeetingLink()}\n\n📋 Kode Meeting: ${meetingCode}\n\nSampai jumpa di meeting! 🙌`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const inviteViaEmail = () => {
    if (!inviteEmailInput.trim() || !meetingCode) return;
    const subject = `Undangan Live Meeting - Chaesa Live`;
    const body = `Halo!\n\nKamu diundang untuk bergabung di Live Meeting.\n\n🔗 Link: ${getMeetingLink()}\n📋 Kode Meeting: ${meetingCode}\n\nKlik link di atas untuk langsung bergabung.\n\nSampai jumpa!`;
    window.open(`mailto:${inviteEmailInput}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setInviteEmailInput("");
    toast({ title: "Email undangan disiapkan!" });
  };

  const copyInviteText = async () => {
    if (!meetingCode) return;
    const text = `🎬 Gabung Live Meeting di Chaesa Live!\n🔗 ${getMeetingLink()}\nKode: ${meetingCode}`;
    await safeCopyToClipboard(text);
    toast({ title: "Teks undangan disalin!" });
  };

  const startRecording = async () => {
    if (!localStream) {
      toast({
        title: "Cannot Start Recording",
        description: "Please enable your camera and microphone first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get all streams for composite recording
      const { audioContext, allStreams } = getCompositeStream();

      // Create hidden canvas for composite video
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      compositeCanvasRef.current = canvas;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Cannot create canvas context");
      }

      // Create video elements for all participants
      const videoElements: Map<string, HTMLVideoElement> = new Map();
      
      // Add local video
      const localVideo = document.createElement("video");
      localVideo.srcObject = localStream;
      localVideo.play();
      videoElements.set("local", localVideo);

      // Add remote videos
      Array.from(rtcParticipants.values()).forEach((participant) => {
        if (participant.stream) {
          const video = document.createElement("video");
          video.srcObject = participant.stream;
          video.play();
          videoElements.set(participant.userId, video);
        }
      });

      // Calculate grid layout
      const totalParticipants = videoElements.size;
      const cols = Math.ceil(Math.sqrt(totalParticipants));
      const rows = Math.ceil(totalParticipants / cols);
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      // Draw composite video at 30fps
      let animationFrameId: number;
      const drawComposite = () => {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let index = 0;
        videoElements.forEach((video) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = col * cellWidth;
          const y = row * cellHeight;

          // Draw video with aspect ratio
          const videoAspect = video.videoWidth / video.videoHeight;
          const cellAspect = cellWidth / cellHeight;
          
          let drawWidth = cellWidth;
          let drawHeight = cellHeight;
          let drawX = x;
          let drawY = y;

          if (videoAspect > cellAspect) {
            drawHeight = cellWidth / videoAspect;
            drawY = y + (cellHeight - drawHeight) / 2;
          } else {
            drawWidth = cellHeight * videoAspect;
            drawX = x + (cellWidth - drawWidth) / 2;
          }

          ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
          
          // Draw border
          ctx.strokeStyle = "#404040";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cellWidth, cellHeight);
          
          index++;
        });

        animationFrameId = requestAnimationFrame(drawComposite);
      };
      drawComposite();

      // Get canvas stream
      const canvasStream = canvas.captureStream(30);

      // Mix audio from all streams
      let mixedAudioTrack: MediaStreamTrack | null = null;
      if (audioContext && allStreams.some(s => s.getAudioTracks().length > 0)) {
        const destination = audioContext.createMediaStreamDestination();
        
        allStreams.forEach((stream) => {
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            const source = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));
            source.connect(destination);
          }
        });

        const mixedAudioTracks = destination.stream.getAudioTracks();
        if (mixedAudioTracks.length > 0) {
          mixedAudioTrack = mixedAudioTracks[0];
        }
      }

      // Combine video from canvas and mixed audio
      const recordingStream = new MediaStream();
      canvasStream.getVideoTracks().forEach(track => recordingStream.addTrack(track));
      if (mixedAudioTrack) {
        recordingStream.addTrack(mixedAudioTrack);
      }

      compositeStreamRef.current = recordingStream;

      // Create MediaRecorder
      const options = { mimeType: "video/webm;codecs=vp9,opus" };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm;codecs=vp8,opus";
      }

      const mediaRecorder = new MediaRecorder(recordingStream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop animation
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        // Stop all tracks
        recordingStream.getTracks().forEach(track => track.stop());
        if (audioContext) {
          audioContext.close();
        }

        // Clean up video elements
        videoElements.forEach(video => {
          video.pause();
          video.srcObject = null;
        });

        // Create download
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chaesa-meeting-${meetingCode}-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Recording Saved",
          description: `Meeting recording with ${totalParticipants} participant(s) has been downloaded.`,
        });
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Composite Recording Started",
        description: `Recording ${totalParticipants} participant(s) in grid layout.`,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Failed",
        description: "Could not start recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      toast({
        title: "Recording Stopped",
        description: "Processing your recording...",
      });
    }
  };

  const formatRecordingDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl/Cmd + D: Toggle mic
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        toggleMic();
      }
      // Ctrl/Cmd + E: Toggle camera
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        toggleCamera();
      }
      // Ctrl/Cmd + Shift + H: Toggle hand raise
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "H") {
        e.preventDefault();
        toggleHandRaise();
      }
      // Ctrl/Cmd + Shift + C: Toggle chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        setShowChat(prev => !prev);
      }
      // Ctrl/Cmd + Shift + P: Toggle participants
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setShowParticipants(prev => !prev);
      }
      // Ctrl/Cmd + Shift + S: Toggle Studio Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        toggleStudioMode();
      }
      // ?: Show keyboard shortcuts
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
    };

    if (isJoined) {
      window.addEventListener("keydown", handleKeyboard);
      return () => window.removeEventListener("keydown", handleKeyboard);
    }
  }, [isJoined, toggleMic, toggleCamera]);

  // Check meeting limits every minute (for Free tier enforcement)
  useEffect(() => {
    if (!isJoined || !meetingId || !currentUser?.id) return;

    const checkLimits = async () => {
      try {
        const limits = await meetingIntegrationService.monitorMeetingLimits(meetingId, currentUser.id);
        setMeetingLimits(limits);

        // Show warning at 10 minutes remaining for free users
        if (!limits.isPro && limits.timeRemaining !== undefined && limits.timeRemaining <= 10 && limits.timeRemaining > 0) {
          if (!showLimitWarning) {
            setShowLimitWarning(true);
            toast({
              title: "⏰ Time Limit Warning",
              description: `Your meeting will end in ${Math.ceil(limits.timeRemaining)} minutes. Upgrade to Pro for unlimited duration!`,
              variant: "destructive",
              duration: 10000,
            });
          }
        }

        // Auto-end meeting if limit reached
        if (limits.shouldEnd) {
          setShowUpgradeModal(true);
          toast({
            title: "⏱️ Meeting Time Limit Reached",
            description: limits.reason === "duration" 
              ? `Free tier meetings are limited to ${limits.maxDuration} minutes. Upgrade to Pro for unlimited meetings!`
              : "Participant limit reached for this plan.",
            variant: "destructive",
          });

          // End meeting after 30 seconds grace period
          setTimeout(() => {
            router.push("/pricing");
          }, 30000);
        }
      } catch (error) {
        console.error("Error checking meeting limits:", error);
      }
    };

    // Check immediately
    checkLimits();

    // Then check every minute
    const interval = setInterval(checkLimits, 60000);

    return () => clearInterval(interval);
  }, [isJoined, meetingId, currentUser?.id, showLimitWarning, router, toast]);

  // Toggle hand raise
  const toggleHandRaise = async () => {
    if (!meetingId || !currentUser?.id) return;
    
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    
    await meetingService.updateParticipantStatus(meetingId, currentUser.id, {
      hand_raised: newState
    });

    toast({
      title: newState ? "Hand Raised ✋" : "Hand Lowered",
      description: newState ? "The host will be notified" : "Your hand has been lowered",
    });
  };

  // Send reaction
  const sendReaction = async (emoji: string) => {
    if (!meetingId || !currentUser?.id) return;

    // Add reaction locally with timeout
    const reactionId = `${currentUser.id}-${Date.now()}`;
    setReactions(prev => {
      const newMap = new Map(prev);
      newMap.set(reactionId, { emoji, timestamp: Date.now() });
      return newMap;
    });

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setReactions(prev => {
        const newMap = new Map(prev);
        newMap.delete(reactionId);
        return newMap;
      });
    }, 3000);

    // Send to other participants via chat as system message
    await meetingService.sendChatMessage(
      meetingId, 
      currentUser.id, 
      `__REACTION__${emoji}__${currentUser.name}`
    );

    setShowReactionsMenu(false);
  };

  // Toggle meeting lock (host only)
  const toggleMeetingLock = async () => {
    if (!meetingId) return;
    
    const newState = !meetingLocked;
    setMeetingLocked(newState);

    // Update meeting in database
    await meetingService.updateMeeting(meetingId, { is_locked: newState });

    toast({
      title: newState ? "🔒 Meeting Locked" : "🔓 Meeting Unlocked",
      description: newState 
        ? "No new participants can join" 
        : "New participants can now join",
    });
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(prev => prev === "grid" ? "speaker" : "grid");
    toast({
      title: `${viewMode === "grid" ? "Speaker" : "Grid"} View`,
      description: `Switched to ${viewMode === "grid" ? "speaker" : "grid"} view`,
    });
  };

  // Enter Picture-in-Picture mode
  const enterPipMode = async () => {
    if (localVideoRef.current && document.pictureInPictureEnabled) {
      try {
        await localVideoRef.current.requestPictureInPicture();
        setIsPipMode(true);
        toast({
          title: "Picture-in-Picture Enabled",
          description: "Video window will float above other windows",
        });
      } catch (error) {
        console.error("PiP error:", error);
      }
    }
  };

  // Toggle background blur
  const toggleBackgroundBlur = () => {
    setIsBackgroundBlurred(prev => !prev);
    toast({
      title: isBackgroundBlurred ? "Background Blur Off" : "Background Blur On",
      description: isBackgroundBlurred 
        ? "Your background is now visible" 
        : "Your background is now blurred",
    });
  };

  // Toggle noise suppression
  const toggleNoiseSuppression = () => {
    setIsNoiseSuppressed(prev => !prev);
    toast({
      title: isNoiseSuppressed ? "Noise Suppression Off" : "Noise Suppression On",
      description: isNoiseSuppressed 
        ? "Audio enhancement disabled" 
        : "Audio enhancement enabled",
    });
  };

  // Toggle live captions
  const toggleCaptions = () => {
    setShowCaptions(prev => !prev);
    toast({
      title: showCaptions ? "Captions Off" : "Captions On",
      description: showCaptions 
        ? "Live captions disabled" 
        : "Live captions enabled",
    });
  };

  if (!meetingCode) return null;

  // Pre-join screen
  if (!isJoined) {
    return (
      <>
        <SEO title="Join Meeting - Chaesa Live" />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 space-y-8 border border-white/20">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Join Meeting</h1>
              <p className="text-purple-200">Meeting Code: <span className="font-mono font-bold text-white">{meetingCode}</span></p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200">Your Name (Optional)</label>
                <Input
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Enter your name or leave empty for Guest"
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleJoin();
                    }
                  }}
                />
                <p className="text-xs text-purple-300">
                  Press Enter or click Join to continue
                </p>
              </div>

              <Button 
                onClick={handleJoin} 
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              >
                <Video className="w-5 h-5 mr-2" />
                Join Meeting
              </Button>
              
              <div className="text-center">
                <button
                  onClick={() => router.push("/")}
                  className="text-purple-300 hover:text-white text-sm transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-xs text-purple-300 text-center">
                Your camera and microphone will be requested after joining
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Meeting Room - Chaesa Live" />
      <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
        {/* Top Bar */}
        {!isStudioMode && (
          <div className="h-16 bg-gray-800/50 backdrop-blur border-b border-gray-700 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
                <span className="text-white font-medium">{meetingCode}</span>
                <button onClick={copyMeetingCode} className="text-gray-400 hover:text-white transition-colors">
                  {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 rounded-lg border border-red-600/50 animate-pulse">
                  <Circle className="w-3 h-3 fill-red-500 text-red-500" />
                  <span className="text-red-400 font-medium text-sm">
                    REC {formatRecordingDuration(recordingDuration)}
                  </span>
                </div>
              )}
              {meetingLimits && !meetingLimits.isPro && meetingLimits.timeRemaining !== undefined && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                  meetingLimits.timeRemaining <= 10 
                  ? "bg-red-600/20 border-red-600/50 animate-pulse" 
                  : meetingLimits.timeRemaining <= 20
                  ? "bg-yellow-600/20 border-yellow-600/50"
                  : "bg-blue-600/20 border-blue-600/50"
                )}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2M16 12h4l-2 3" />
                  </svg>
                  <span className={cn(
                    "font-medium text-sm",
                    meetingLimits.timeRemaining <= 10 
                    ? "text-red-400" 
                    : meetingLimits.timeRemaining <= 20
                    ? "text-yellow-400"
                    : "text-blue-400"
                  )}>
                    {Math.ceil(meetingLimits.timeRemaining)} min left (Free)
                  </span>
                </div>
              )}
              <span className="text-gray-400 text-sm hidden sm:inline">
                {participants.length} participant{participants.length !== 1 && "s"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Studio Mode Toggle (for Content Creators) */}
              <Button
                variant={isStudioMode ? "default" : "ghost"}
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", isStudioMode && "bg-purple-600 text-white")}
                onClick={toggleStudioMode}
                title="Studio Mode (Hide UI for OBS)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              </Button>

              {/* Original Sound Toggle (for Musicians/Podcasters) */}
              <Button
                variant={isOriginalSound ? "default" : "ghost"}
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", isOriginalSound && "bg-blue-600 text-white")}
                onClick={toggleOriginalSound}
                title="Original Sound (Disable audio processing)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 18V5l12-2v13M9 9l12-2M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
                </svg>
              </Button>

              {/* Live Sales CTA Panel (for E-commerce/Digital Marketing) */}
              <Button
                variant={showCTAPanel ? "default" : "ghost"}
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", showCTAPanel && "bg-green-600 text-white")}
                onClick={() => setShowCTAPanel(!showCTAPanel)}
                title="Live Sales CTA"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </Button>

              <div className="w-px h-8 bg-gray-700 mx-2" />

              {/* View Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={toggleViewMode}
                title={`Switch to ${viewMode === "grid" ? "speaker" : "grid"} view`}
              >
                {viewMode === "grid" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9l3 3-3 3M14 12h-3" />
                  </svg>
                )}
              </Button>

              {/* Meeting Lock Toggle (Host) */}
              <Button
                variant="ghost"
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", meetingLocked && "text-red-400")}
                onClick={toggleMeetingLock}
                title={meetingLocked ? "Unlock meeting" : "Lock meeting"}
              >
                {meetingLocked ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 9 0" />
                    <path d="M16 7h.01" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 9 0" />
                    <path d="M16 7h.01" />
                  </svg>
                )}
              </Button>

              {/* Keyboard Shortcuts Help */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => setShowKeyboardShortcuts(true)}
                title="Keyboard shortcuts (?)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 10h4M14 10h4M6 14h12" />
                </svg>
              </Button>

              <div className="w-px h-8 bg-gray-700 mx-2" />

              {/* Polls */}
              <Button
                variant="ghost"
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", showPolls && "bg-gray-800 text-white")}
                onClick={() => setShowPolls(!showPolls)}
                title="Polls"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h4v8H3zM10 3h4v18h-4zM17 8h4v13h-4z" />
                </svg>
              </Button>

              {/* Whiteboard */}
              <Button
                variant="ghost"
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", showWhiteboard && "bg-gray-800 text-white")}
                onClick={() => setShowWhiteboard(!showWhiteboard)}
                title="Whiteboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 9l3 3-3 3M14 12h-3" />
                </svg>
              </Button>

              {/* Breakout Rooms */}
              <Button
                variant="ghost"
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", showBreakoutRooms && "bg-gray-800 text-white")}
                onClick={() => setShowBreakoutRooms(!showBreakoutRooms)}
                title="Breakout Rooms"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                </svg>
              </Button>

              {/* Q&A */}
              <Button
                variant="ghost"
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", showQA && "bg-gray-800 text-white")}
                onClick={() => setShowQA(!showQA)}
                title="Q&A"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                </svg>
              </Button>

              <div className="w-px h-8 bg-gray-700 mx-2" />

              <Button
                variant="ghost"
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", showInvitePanel && "bg-green-600 text-white")}
                onClick={() => { setShowInvitePanel(!showInvitePanel); if (!showInvitePanel) { setShowChat(false); setShowParticipants(false); } }}
                title="Undang Peserta"
              >
                <UserPlus className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", showParticipants && "bg-gray-800 text-white")}
                onClick={() => { setShowParticipants(!showParticipants); if (!showParticipants) setShowInvitePanel(false); }}
              >
                <Users className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("text-gray-400 hover:text-white hover:bg-gray-800", showChat && "bg-gray-800 text-white")}
                onClick={() => { setShowChat(!showChat); if (!showChat) setShowInvitePanel(false); }}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr h-full max-h-full">
              {/* Local Video */}
              <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video shadow-lg ring-1 ring-white/10 group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn("w-full h-full object-cover mirror", !isCameraOn && "hidden")}
                />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="w-24 h-24 border-4 border-gray-700">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`} />
                      <AvatarFallback className="text-2xl">{currentUser?.name?.[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-lg text-white text-sm font-medium">
                  You ({currentUser?.name})
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {!isMicOn && <div className="p-1.5 bg-red-500/80 rounded-full"><MicOff className="w-3 h-3 text-white" /></div>}
                </div>
              </div>

              {/* Remote Participants */}
              {Array.from(rtcParticipants.values()).map((participant) => (
                <div key={participant.userId} className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video shadow-lg ring-1 ring-white/10">
                  <video
                    autoPlay
                    playsInline
                    className={cn("w-full h-full object-cover", !participant.isCameraOn && "hidden")}
                    ref={(el) => {
                      if (el && participant.stream) el.srcObject = participant.stream;
                    }}
                  />
                  {!participant.isCameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="w-24 h-24 border-4 border-gray-700">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.displayName}`} />
                        <AvatarFallback className="text-2xl">{participant.displayName[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-lg text-white text-sm font-medium">
                    {participant.displayName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invite Panel */}
          {showInvitePanel && (
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0 transition-all duration-300">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-green-400" />
                  Undang Peserta
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setShowInvitePanel(false)} className="text-gray-400 hover:text-white h-8 w-8 p-0">
                  ✕
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wide">Link Meeting</label>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-900 rounded-lg border border-gray-700">
                    <LinkIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-xs text-gray-300 truncate flex-1">{getMeetingLink()}</span>
                    <Button size="sm" variant="ghost" onClick={copyMeetingLink} className="h-7 px-2 text-gray-400 hover:text-white">
                      {inviteLinkCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wide">Kode Meeting</label>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-900 rounded-lg border border-gray-700">
                    <code className="text-sm text-green-400 font-mono flex-1">{meetingCode}</code>
                    <Button size="sm" variant="ghost" onClick={copyMeetingCode} className="h-7 px-2 text-gray-400 hover:text-white">
                      {hasCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wide">Undang via Email</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@contoh.com"
                      value={inviteEmailInput}
                      onChange={(e) => setInviteEmailInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && inviteEmailInput.trim()) inviteViaEmail(); }}
                      className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 text-sm h-9"
                    />
                    <Button size="sm" onClick={inviteViaEmail} disabled={!inviteEmailInput.trim()} className="bg-blue-600 hover:bg-blue-700 h-9 px-3">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4 space-y-2">
                  <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wide">Bagikan</label>
                  <Button variant="outline" size="sm" onClick={inviteViaWhatsApp} className="w-full justify-start border-gray-700 text-green-400 hover:bg-green-900/20 hover:border-green-700">
                    <MessageSquare className="w-4 h-4 mr-2" /> Bagikan via WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyInviteText} className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-700">
                    <Copy className="w-4 h-4 mr-2" /> Salin Teks Undangan
                  </Button>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Peserta bisa langsung gabung lewat link atau masukkan kode meeting di halaman Chaesa Live.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Right Sidebar (Chat/Participants) */}
          {(showChat || showParticipants) && (
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0 transition-all duration-300">
              {showParticipants && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-white font-medium">Participants ({participants.length})</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.display_name}`} />
                          <AvatarFallback>{p.display_name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-gray-200 text-sm">{p.display_name}</span>
                        {p.user_id === currentUser?.id && (
                          <span className="text-xs text-gray-500">(You)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showChat && (
                <div className={cn("flex flex-col min-h-0", showParticipants ? "h-1/2 border-t border-gray-700" : "flex-1")}>
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-white font-medium">Chat</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">
                            {participants.find(p => p.user_id === msg.user_id)?.display_name || "Unknown"}
                          </span>
                          <span className="text-[10px] text-gray-600">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-200 text-sm bg-gray-700/50 p-2 rounded-lg">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Polls Panel */}
          {showPolls && (
            <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-medium">Polls</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPolls(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {polls.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 13h4v8H3zM10 3h4v18h-4zM17 8h4v13h-4z" />
                    </svg>
                    <p className="text-sm">No polls yet</p>
                    <p className="text-xs mt-1">Host can create polls</p>
                  </div>
                ) : (
                  polls.map((poll) => (
                    <div key={poll.id} className="bg-gray-900 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="text-white font-medium">{poll.question}</h4>
                        {poll.is_active && (
                          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Active</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {poll.options?.map((option: any) => (
                          <button
                            key={option.id}
                            className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded p-3 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-200">{option.option_text}</span>
                              <span className="text-sm text-gray-400">{option.vote_count || 0} votes</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-700">
                <Button className="w-full">
                  Create New Poll
                </Button>
              </div>
            </div>
          )}

          {/* Whiteboard Panel */}
          {showWhiteboard && (
            <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-medium">Whiteboard</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  title="Clear whiteboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2h-2a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowWhiteboard(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <div className="flex-1 bg-white relative">
                <canvas
                  className="w-full h-full cursor-crosshair"
                  style={{ touchAction: "none" }}
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 rounded-lg p-2 flex gap-2 shadow-xl">
                  {["black", "red", "blue", "green", "yellow"].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 bg-gray-900 border-gray-700 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Breakout Rooms Panel */}
          {showBreakoutRooms && (
            <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-medium">Breakout Rooms</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBreakoutRooms(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center text-gray-400 mt-8">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 1 0-7.75" />
                  </svg>
                  <p className="text-sm">No breakout rooms</p>
                  <p className="text-xs mt-1">Host can create rooms</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-700 space-y-2">
                <Button className="w-full">
                  Create Breakout Rooms
                </Button>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="2"
                    max="10"
                    defaultValue="2"
                    placeholder="Number of rooms"
                    className="flex-1 bg-gray-900 border-gray-700 text-white"
                  />
                  <Button variant="secondary">
                    Auto Assign
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Q&A Panel */}
          {showQA && (
            <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-medium">Q&A</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowQA(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center text-gray-400 mt-8">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                  </svg>
                  <p className="text-sm">No questions yet</p>
                  <p className="text-xs mt-1">Ask a question below</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-700">
                <form className="space-y-2">
                  <Input
                    placeholder="Ask a question..."
                    className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                  />
                  <Button type="submit" className="w-full">
                    Submit Question
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Live Sales CTA Panel (Host Control) */}
          {showCTAPanel && (
            <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0 absolute right-0 top-16 bottom-20 z-40">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-medium">Live Sales CTA</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCTAPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {ctaList.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm">No CTAs created yet</p>
                    <p className="text-xs mt-1">Create one to start selling!</p>
                  </div>
                ) : (
                  ctaList.map((cta) => (
                    <div key={cta.id} className="bg-gray-900 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{cta.title}</h4>
                          {cta.price && (
                            <p className="text-green-400 text-sm mt-1">
                              Rp {cta.price.toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                        {cta.is_active && (
                          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Live</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>👆 {cta.clicks_count || 0} clicks</span>
                      </div>

                      <div className="flex gap-2">
                        {!cta.is_active ? (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                              await ctaService.activateCTA(cta.id);
                              toast({
                                title: "CTA Activated!",
                                description: "All participants can now see this offer",
                              });
                            }}
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={async () => {
                              await ctaService.deactivateCTA(cta.id);
                              toast({
                                title: "CTA Deactivated",
                                description: "Offer hidden from participants",
                              });
                            }}
                          >
                            Deactivate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400"
                          onClick={async () => {
                            await ctaService.deleteCTA(cta.id);
                            setCtaList(prev => prev.filter(c => c.id !== cta.id));
                            toast({
                              title: "CTA Deleted",
                            });
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-700">
                {!showCTAForm ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={() => setShowCTAForm(true)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New CTA
                  </Button>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      
                      if (!meetingId) return;
                      
                      const { data, error } = await ctaService.createCTA(meetingId, {
                        title: formData.get('title') as string,
                        description: formData.get('description') as string,
                        button_text: formData.get('button_text') as string,
                        button_url: formData.get('button_url') as string,
                        button_color: formData.get('button_color') as string,
                        duration_seconds: parseInt(formData.get('duration') as string) || 30,
                        price: parseInt(formData.get('price') as string) || 0,
                      });

                      if (error) {
                        toast({
                          title: "Failed to create CTA",
                          description: error.message,
                          variant: "destructive",
                        });
                        return;
                      }

                      if (data) {
                        setCtaList(prev => [data, ...prev]);
                        setShowCTAForm(false);
                        toast({
                          title: "CTA Created!",
                          description: "Click Activate to show it to participants",
                        });
                      }
                    }}
                  >
                    <Input
                      name="title"
                      placeholder="Title (e.g., Flash Sale 50%)"
                      required
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                    <Input
                      name="description"
                      placeholder="Description (optional)"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                    <Input
                      name="price"
                      type="number"
                      placeholder="Price (Rp)"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                    <Input
                      name="button_text"
                      placeholder="Button Text (e.g., Beli Sekarang)"
                      required
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                    <Input
                      name="button_url"
                      type="url"
                      placeholder="Link URL"
                      required
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                    <div className="flex gap-2">
                      <Input
                        name="button_color"
                        type="color"
                        defaultValue="#3B82F6"
                        className="w-16 h-10 bg-gray-900 border-gray-700"
                      />
                      <Input
                        name="duration"
                        type="number"
                        placeholder="Duration (seconds)"
                        defaultValue="30"
                        className="flex-1 bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Create
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setShowCTAForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Advanced Video/Audio Settings */}
          <div className="flex gap-2">
            <Button
              variant={isBackgroundBlurred ? "default" : "secondary"}
              size="icon"
              className="rounded-full w-10 h-10 p-0"
              onClick={toggleBackgroundBlur}
              title="Toggle background blur"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2h-2a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <path d="M9 9l6 6M15 9l-6 6" />
              </svg>
            </Button>

            <Button
              variant={isNoiseSuppressed ? "default" : "secondary"}
              size="icon"
              className="rounded-full w-10 h-10 p-0"
              onClick={toggleNoiseSuppression}
              title="Toggle noise suppression"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2h-2a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <path d="M9 9l6 6M15 9l-6 6" />
              </svg>
            </Button>

            <Button
              variant={showCaptions ? "default" : "secondary"}
              size="icon"
              className="rounded-full w-10 h-10 p-0"
              onClick={toggleCaptions}
              title="Toggle live captions"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 10h4M14 10h4M6 14h12" />
                <path d="M9 9l6 6M15 9l-6 6" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Live Captions Overlay */}
        {showCaptions && currentCaption && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4">
            <div className="bg-black/90 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl">
              <p className="text-lg leading-relaxed">{currentCaption}</p>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        {!isStudioMode && (
          <div className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-center gap-4 shrink-0 px-4">
            <Button
              variant={isMicOn ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full w-12 h-12 p-0"
              onClick={toggleMic}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            
            <Button
              variant={isCameraOn ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full w-12 h-12 p-0"
              onClick={toggleCamera}
            >
              {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            <Button
              variant={isScreenSharing ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-12 h-12 p-0"
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </Button>

            <div className="w-px h-8 bg-gray-700 mx-2" />

            {/* Hand Raise */}
            <Button
              variant={isHandRaised ? "default" : "secondary"}
              size="lg"
              className={cn("rounded-full w-12 h-12 p-0", isHandRaised && "bg-yellow-500 hover:bg-yellow-600")}
              onClick={toggleHandRaise}
              title="Raise hand (Ctrl+Shift+H)"
            >
              <span className="text-xl">✋</span>
            </Button>

            {/* Reactions Menu */}
            <div className="relative">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full w-12 h-12 p-0"
                onClick={() => setShowReactionsMenu(!showReactionsMenu)}
                title="Send reaction"
              >
                <span className="text-xl">😊</span>
              </Button>
              
              {showReactionsMenu && (
                <div className="absolute bottom-16 left-0 bg-gray-800 border border-gray-700 rounded-xl p-2 flex gap-2 shadow-xl">
                  {["👍", "❤️", "😂", "👏", "🎉", "🤔", "👋", "🔥"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="text-2xl hover:scale-125 transition-transform p-2 hover:bg-gray-700 rounded-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture-in-Picture */}
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full w-12 h-12 p-0"
              onClick={enterPipMode}
              title="Picture-in-Picture"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </Button>

            <div className="w-px h-8 bg-gray-700 mx-2" />

            <Button
              variant={isRecording ? "destructive" : "secondary"}
              size="lg"
              className={cn(
                "rounded-full w-12 h-12 p-0",
                isRecording && "animate-pulse"
              )}
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              <Circle className={cn("w-5 h-5", isRecording && "fill-current")} />
            </Button>

            <div className="w-px h-8 bg-gray-700 mx-2" />

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full px-8 bg-red-600 hover:bg-red-700"
              onClick={() => router.push("/")}
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          </div>
        )}

        {/* Reactions Overlay */}
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none z-50">
          {Array.from(reactions.values()).map((reaction, i) => (
            <div
              key={i}
              className="text-6xl animate-bounce"
              style={{
                animation: "bounce 0.5s ease-out, fadeOut 3s ease-out"
              }}
            >
              {reaction.emoji}
            </div>
          ))}
        </div>

        {/* Live Sales CTA Overlay (Participant View) */}
        {activeCTA && !isStudioMode && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl max-w-md w-full p-8 space-y-6 shadow-2xl animate-in zoom-in-95 pointer-events-auto">
              <div className="text-center space-y-4">
                {activeCTA.image_url && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden">
                    <img 
                      src={activeCTA.image_url} 
                      alt={activeCTA.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {activeCTA.title}
                  </h2>
                  {activeCTA.description && (
                    <p className="text-purple-100 text-lg">
                      {activeCTA.description}
                    </p>
                  )}
                </div>

                {activeCTA.price && activeCTA.price > 0 && (
                  <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                    <div className="text-sm text-purple-200 mb-1">Special Price</div>
                    <div className="text-4xl font-bold text-white">
                      Rp {activeCTA.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                )}
              </div>

              <Button 
                className="w-full h-14 text-xl font-bold"
                style={{ backgroundColor: activeCTA.button_color || "#3B82F6" }}
                onClick={() => handleCTAClick(activeCTA.id)}
              >
                {activeCTA.button_text || "Beli Sekarang"} 🛍️
              </Button>

              <button
                onClick={() => setActiveCTA(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Live Sales CTA Panel (Host Control) */}
        {showCTAPanel && (
          <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0 absolute right-0 top-16 bottom-20 z-40">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-medium">Live Sales CTA</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCTAPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {ctaList.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm">No CTAs created yet</p>
                  <p className="text-xs mt-1">Create one to start selling!</p>
                </div>
              ) : (
                ctaList.map((cta) => (
                  <div key={cta.id} className="bg-gray-900 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{cta.title}</h4>
                        {cta.price && (
                          <p className="text-green-400 text-sm mt-1">
                            Rp {cta.price.toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                      {cta.is_active && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Live</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>👆 {cta.clicks_count || 0} clicks</span>
                    </div>

                    <div className="flex gap-2">
                      {!cta.is_active ? (
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            await ctaService.activateCTA(cta.id);
                            toast({
                              title: "CTA Activated!",
                              description: "All participants can now see this offer",
                            });
                          }}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={async () => {
                            await ctaService.deactivateCTA(cta.id);
                            toast({
                              title: "CTA Deactivated",
                              description: "Offer hidden from participants",
                            });
                          }}
                        >
                          Deactivate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={async () => {
                          await ctaService.deleteCTA(cta.id);
                          setCtaList(prev => prev.filter(c => c.id !== cta.id));
                          toast({
                            title: "CTA Deleted",
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-700">
              {!showCTAForm ? (
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => setShowCTAForm(true)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New CTA
                </Button>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    
                    if (!meetingId) return;
                    
                    const { data, error } = await ctaService.createCTA(meetingId, {
                      title: formData.get('title') as string,
                      description: formData.get('description') as string,
                      button_text: formData.get('button_text') as string,
                      button_url: formData.get('button_url') as string,
                      button_color: formData.get('button_color') as string,
                      duration_seconds: parseInt(formData.get('duration') as string) || 30,
                      price: parseInt(formData.get('price') as string) || 0,
                    });

                    if (error) {
                      toast({
                        title: "Failed to create CTA",
                        description: error.message,
                        variant: "destructive",
                      });
                      return;
                    }

                    if (data) {
                      setCtaList(prev => [data, ...prev]);
                      setShowCTAForm(false);
                      toast({
                        title: "CTA Created!",
                        description: "Click Activate to show it to participants",
                      });
                    }
                  }}
                >
                  <Input
                    name="title"
                    placeholder="Title (e.g., Flash Sale 50%)"
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <Input
                    name="description"
                    placeholder="Description (optional)"
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <Input
                    name="price"
                    type="number"
                    placeholder="Price (Rp)"
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <Input
                    name="button_text"
                    placeholder="Button Text (e.g., Beli Sekarang)"
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <Input
                    name="button_url"
                    type="url"
                    placeholder="Link URL"
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <div className="flex gap-2">
                    <Input
                      name="button_color"
                      type="color"
                      defaultValue="#3B82F6"
                      className="w-16 h-10 bg-gray-900 border-gray-700"
                    />
                    <Input
                      name="duration"
                      type="number"
                      placeholder="Duration (seconds)"
                      defaultValue="30"
                      className="flex-1 bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Create
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setShowCTAForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl max-w-md w-full p-8 space-y-6 border border-gray-700">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Free Tier Limit Reached
                  </h2>
                  <p className="text-gray-400">
                    You've reached the {meetingLimits?.maxDuration} minute limit for free meetings. 
                    Upgrade to Pro for unlimited meeting duration!
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30">
                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Unlimited meeting duration</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Cloud recording & storage</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Breakout rooms & polls</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Priority support</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    $14.99<span className="text-lg text-gray-400">/month</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    or $149.99/year (save 17%)
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/pricing" className="block">
                  <Button className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Upgrade to Pro
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    router.push("/");
                  }}
                >
                  End Meeting
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Dialog */}
        <KeyboardShortcutsDialog 
          open={showKeyboardShortcuts} 
          onOpenChange={setShowKeyboardShortcuts}
        />
      </div>
    </>
  );
}