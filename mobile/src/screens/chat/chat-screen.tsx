import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// expo-video loaded lazily — may not be in native build
let VideoView: any = null;
let useVideoPlayer: any = null;
try {
  const mod = require('expo-video');
  VideoView = mod.VideoView;
  useVideoPlayer = mod.useVideoPlayer;
} catch {
  console.warn('[Chat] expo-video not available');
}
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GradientHeader } from '../../components/shared/GradientHeader';
import {
  figmaColors,
  figmaFonts,
  figmaSpacing,
  figmaRadius,
} from '../../constants/theme';
import { getSessionMessages, ChatMessageItem } from '../../services/chat.service';

// Lazy-load expo-av (requires native build / dev client)
let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch {
  console.warn('[VoiceChat] expo-av not available — audio disabled');
}

// Assets — MP4 avatar animations
const TALKING_VIDEO = require('../../../asset/talking_avatar.mp4');
const WAITING_VIDEO = require('../../../asset/waiting_avatar.mp4');

// Derive WS URL from API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const WS_URL = API_URL.replace(/^http/, 'ws').replace('/api/v1', '') + '/ws/voice-chat';

type VoiceState = 'CONNECTING' | 'IDLE' | 'LISTENING' | 'PROCESSING' | 'AI_SPEAKING';

// Chat bubble type for in-memory conversation history
interface ChatBubble {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Recording options built lazily (Audio may not be available in Expo Go)
function getRecordingOptions() {
  if (!Audio) return null;
  return {
    isMeteringEnabled: false,
    android: {
      extension: '.wav',
      outputFormat: Audio.AndroidOutputFormat.DEFAULT,
      audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 256000,
    },
    ios: {
      extension: '.wav',
      outputFormat: Audio.IOSOutputFormat.LINEARPCM,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 256000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {},
  };
}

/**
 * Voice-assistant hybrid AI chat screen.
 * Exported as ChatScreen to keep tab route unchanged.
 */
export function ChatScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  const [state, setState] = useState<VoiceState>('CONNECTING');
  const [textInput, setTextInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<any>(null);
  const soundRef = useRef<any>(null);
  const playingRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  // ── Video player for avatar (may be null if expo-video unavailable) ──
  const player = useVideoPlayer ? useVideoPlayer(WAITING_VIDEO, (p: any) => {
    p.loop = true;
    p.play();
  }) : null;

  // ── Load token from SecureStore ──────────────────────────
  useEffect(() => {
    SecureStore.getItemAsync('accessToken').then((t) => {
      if (t) setToken(t);
    });
  }, []);

  // ── Derived state ───────────────────────────────────────
  const isTalking = state === 'AI_SPEAKING';
  const micDisabled = state === 'CONNECTING' || state === 'PROCESSING';

  // ── Switch avatar video on state change ──────────────────
  useEffect(() => {
    if (!player) return;
    const source = isTalking ? TALKING_VIDEO : WAITING_VIDEO;
    player.replace(source);
    player.loop = true;
    player.play();
  }, [isTalking]);

  // ── Helper: add or update a message bubble ───────────────
  const addMessage = useCallback((bubble: ChatBubble) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === bubble.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = bubble;
        return updated;
      }
      return [...prev, bubble];
    });
  }, []);

  // ── Load session history ─────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const welcomeMsg: ChatBubble = {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI sức khỏe. Tôi có thể giúp gì cho bạn?',
      timestamp: new Date(),
    };
    getSessionMessages(sessionId)
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          const history: ChatBubble[] = data.messages.map(
            (m: ChatMessageItem) => ({
              id: m.id,
              role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
              content: m.content,
              timestamp: new Date(m.createdAt),
            })
          );
          setMessages(history);
        } else {
          setMessages([welcomeMsg]);
        }
      })
      .catch(() => {
        setMessages([welcomeMsg]);
      });
  }, [sessionId]);

  // ── WebSocket lifecycle ──────────────────────────────────
  useEffect(() => {
    if (!token) {
      console.log('[FE-WS] no token yet, skipping WS connect');
      return;
    }

    const url = `${WS_URL}?token=${token}`;
    console.log('[FE-WS] connecting to:', url);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[FE-WS] onopen — readyState:', ws.readyState);
    };

    ws.onmessage = (event) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        console.log('[FE-WS] non-JSON message:', String(event.data).slice(0, 200));
        return;
      }

      console.log('[FE-WS] message:', msg.type, JSON.stringify(msg).slice(0, 300));

      switch (msg.type) {
        case 'ready':
          setSessionId(msg.sessionId);
          setState('IDLE');
          // Welcome message shown only if history load finds nothing (see useEffect below)
          break;

        case 'transcript_in':
          addMessage({
            id: 'user-pending',
            role: 'user',
            content: msg.text,
            timestamp: new Date(),
          });
          break;

        case 'transcript_out':
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === 'ai-streaming');
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = {
                ...updated[idx],
                content: updated[idx].content + msg.text,
              };
              return updated;
            }
            return [
              ...prev,
              {
                id: 'ai-streaming',
                role: 'assistant' as const,
                content: msg.text,
                timestamp: new Date(),
              },
            ];
          });
          break;

        case 'audio_response':
          playingRef.current = true;
          setState('AI_SPEAKING');
          playAudio(msg.audio);
          break;

        case 'turn_complete':
          // Finalize pending message IDs
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === 'user-pending') {
                return { ...m, id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
              }
              if (m.id === 'ai-streaming') {
                return { ...m, id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
              }
              return m;
            })
          );
          if (!playingRef.current) {
            setState('IDLE');
          }
          break;

        case 'interrupted':
          stopPlayback();
          // Finalize streaming messages
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === 'ai-streaming') {
                return { ...m, id: `ai-interrupted-${Date.now()}` };
              }
              return m;
            })
          );
          setState('IDLE');
          break;

        case 'error':
          console.warn('[FE-WS] server error:', msg.message);
          addMessage({
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: msg.message || 'Đã xảy ra lỗi. Vui lòng thử lại.',
            timestamp: new Date(),
          });
          setState('IDLE');
          break;
      }
    };

    ws.onclose = (event) => {
      console.log(
        '[FE-WS] onclose — code:', event.code,
        'reason:', event.reason,
        'wasClean:', event.wasClean
      );
    };

    ws.onerror = (err) => {
      console.error('[FE-WS] onerror:', JSON.stringify(err));
      setState('IDLE');
      addMessage({
        id: `error-conn-${Date.now()}`,
        role: 'assistant',
        content: 'Kết nối voice không thành công. Bạn có thể nhập tin nhắn bằng văn bản.',
        timestamp: new Date(),
      });
    };

    // Fallback: if not ready after 5s, go IDLE for text-only mode
    const timeout = setTimeout(() => {
      console.log('[FE-WS] 5s timeout — readyState:', ws.readyState, 'state:', state);
      if (ws.readyState !== WebSocket.OPEN || state === 'CONNECTING') {
        setState('IDLE');
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      ws.close();
    };
  }, [token]);

  // ── Audio playback ───────────────────────────────────────

  const playAudio = async (wavBase64: string) => {
    if (!Audio) return;
    try {
      await stopPlayback();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const fileUri = `${FileSystem.cacheDirectory}ai_response_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(fileUri, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          playingRef.current = false;
          FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
          setState('IDLE');
        }
      });

      await sound.playAsync();
    } catch (err) {
      console.error('[VoiceChat] Playback error:', err);
      soundRef.current = null;
      playingRef.current = false;
      setState('IDLE');
    }
  };

  const stopPlayback = async () => {
    playingRef.current = false;
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch { /* ignore */ }
      soundRef.current = null;
    }
  };

  // ── Audio recording (push-to-talk) ──────────────────────

  const startRecording = async () => {
    if (!Audio) return;
    try {
      // Clean up any existing recording first
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch { /* ignore */ }
        recordingRef.current = null;
      }

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const opts = getRecordingOptions();
      if (!opts) return;
      const { recording } = await Audio.Recording.createAsync(opts);
      recordingRef.current = recording;
      setState('LISTENING');
    } catch (err) {
      console.error('[VoiceChat] Recording start error:', err);
      setState('IDLE');
      addMessage({
        id: `error-rec-${Date.now()}`,
        role: 'assistant',
        content: 'Không thể ghi âm. Vui lòng nhập tin nhắn bằng văn bản.',
        timestamp: new Date(),
      });
    }
  };

  const stopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      console.log(
        '[FE-WS] stopRecording — uri:', uri ? 'yes' : 'no',
        'ws readyState:', wsRef.current?.readyState
      );
      if (uri && wsRef.current?.readyState === WebSocket.OPEN) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log('[FE-WS] sending audio, size:', base64.length, 'chars');
        wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
        setState('PROCESSING');

        // Timeout: if no response in 15s, go back to IDLE
        setTimeout(() => {
          setState((prev) => prev === 'PROCESSING' ? 'IDLE' : prev);
        }, 15000);
      } else {
        console.log('[FE-WS] WS not open, cannot send audio');
        setState('IDLE');
        addMessage({
          id: `error-ws-${Date.now()}`,
          role: 'assistant',
          content: 'Kết nối voice đã mất. Vui lòng nhập văn bản.',
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error('[VoiceChat] Recording stop error:', err);
      setState('IDLE');
    }
  };

  // ── Mic toggle ──────────────────────────────────────────

  const toggleMic = useCallback(() => {
    if (state === 'LISTENING') {
      stopRecording();
    } else if (state === 'IDLE') {
      startRecording();
    } else if (state === 'AI_SPEAKING') {
      // Interrupt AI and start listening
      stopPlayback();
      startRecording();
    }
  }, [state]);

  // ── Send text ───────────────────────────────────────────

  const sendText = useCallback(async () => {
    const text = textInput.trim();
    if (!text || state !== 'IDLE') return;

    // Add user bubble immediately
    const userBubbleId = `user-${Date.now()}`;
    addMessage({
      id: userBubbleId,
      role: 'user',
      content: text,
      timestamp: new Date(),
    });

    setTextInput('');
    setState('PROCESSING');

    // Try WS first
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', content: text }));
      return;
    }

    // Fallback: REST API for text chat
    try {
      const baseUrl = API_URL.includes('/api/v1') ? API_URL : `${API_URL}/api/v1`;
      const res = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      const reply =
        json?.data?.aiMessage?.content ?? json?.data?.reply ?? 'Không có phản hồi.';
      addMessage({
        id: `ai-rest-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      });
      setState('IDLE');
    } catch (err) {
      console.error('[Chat] REST fallback error:', err);
      addMessage({
        id: `error-rest-${Date.now()}`,
        role: 'assistant',
        content: 'Không thể gửi tin nhắn. Vui lòng thử lại.',
        timestamp: new Date(),
      });
      setState('IDLE');
    }
  }, [textInput, state, token, addMessage]);

  // ── Status text + dot color ─────────────────────────────
  const getStatusInfo = (): { text: string; dotColor: string } => {
    switch (state) {
      case 'CONNECTING':
        return { text: 'Đang kết nối...', dotColor: figmaColors.warning };
      case 'IDLE':
        return { text: 'Trực tuyến', dotColor: figmaColors.success };
      case 'LISTENING':
        return { text: 'Đang nghe...', dotColor: '#EF4444' };
      case 'PROCESSING':
        return { text: 'Đang suy nghĩ...', dotColor: figmaColors.warning };
      case 'AI_SPEAKING':
        return { text: 'Đang trả lời...', dotColor: figmaColors.primary };
      default:
        return { text: '', dotColor: figmaColors.textMuted };
    }
  };

  const statusInfo = getStatusInfo();

  // ── Render a single chat bubble ──────────────────────────
  const renderBubble = useCallback(({ item }: { item: ChatBubble }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.bubbleRow,
          isUser ? styles.bubbleRowRight : styles.bubbleRowLeft,
        ]}
      >
        {!isUser && (
          <View style={styles.bubbleIcon}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={18}
              color={figmaColors.primary}
            />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Chat AI"
        showBack
        rightSlot={
          <TouchableOpacity
            onPress={() => router.push('/chat-history')}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="history" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Avatar bar — small avatar top-left + name + status */}
        <View style={styles.avatarBar}>
          <View style={styles.smallAvatarContainer}>
            {VideoView && player ? (
              <VideoView
                player={player}
                style={styles.smallAvatar}
                nativeControls={false}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.smallAvatar, styles.smallAvatarFallback]}>
                <MaterialCommunityIcons
                  name={isTalking ? 'account-voice' : 'robot-outline'}
                  size={28}
                  color={isTalking ? figmaColors.primary : figmaColors.textMuted}
                />
              </View>
            )}
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>Trợ lý AI</Text>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, { backgroundColor: statusInfo.dotColor }]}
              />
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>
          </View>
        </View>

        {/* Chat transcript */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderBubble}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        {/* Text input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={figmaColors.textMuted}
            value={textInput}
            onChangeText={setTextInput}
            onSubmitEditing={sendText}
            editable={state === 'IDLE'}
            returnKeyType="send"
          />
          {textInput.trim() ? (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={sendText}
              disabled={state !== 'IDLE'}
            >
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Mic toggle button */}
        <View style={styles.micRow}>
          <TouchableOpacity
            style={[
              styles.micBtn,
              (state === 'LISTENING') && styles.micBtnActive,
            ]}
            onPress={toggleMic}
            disabled={micDisabled}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={state === 'LISTENING' ? 'microphone-off' : 'microphone'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: figmaColors.background,
  },
  content: {
    flex: 1,
  },

  // Avatar bar
  avatarBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.md,
    backgroundColor: figmaColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: figmaColors.border,
  },
  smallAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  smallAvatar: {
    width: 56,
    height: 56,
  },
  smallAvatarFallback: {
    backgroundColor: figmaColors.pastelBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  avatarInfo: {
    marginLeft: figmaSpacing.md,
    flex: 1,
  },
  avatarName: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: figmaSpacing.xs,
  },
  statusText: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },

  // Chat list
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.md,
  },

  // Bubble rows
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: figmaSpacing.sm,
    maxWidth: '75%',
  },
  bubbleRowLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
  },
  bubbleRowRight: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  bubbleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: figmaColors.pastelBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: figmaSpacing.xs,
    marginBottom: 2,
  },

  // Bubbles
  bubble: {
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.md,
    borderRadius: figmaRadius.lg,
    flexShrink: 1,
  },
  bubbleUser: {
    backgroundColor: figmaColors.primary,
    borderBottomRightRadius: figmaSpacing.xs,
  },
  bubbleAssistant: {
    backgroundColor: figmaColors.surface,
    borderWidth: 1,
    borderColor: figmaColors.border,
    borderBottomLeftRadius: figmaSpacing.xs,
  },
  bubbleText: {
    fontSize: figmaFonts.sizes.md,
    lineHeight: figmaFonts.sizes.md * figmaFonts.lineHeights.relaxed,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTextAssistant: {
    color: figmaColors.textPrimary,
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.sm,
    gap: figmaSpacing.sm,
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: figmaColors.surface,
    borderRadius: figmaRadius.pill,
    paddingHorizontal: figmaSpacing.xl,
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textPrimary,
    borderWidth: 1,
    borderColor: figmaColors.border,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: figmaColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Mic
  micRow: {
    alignItems: 'center',
    marginBottom: 100,
    paddingTop: figmaSpacing.sm,
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: figmaColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
  },
});
