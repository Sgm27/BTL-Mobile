import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
} from '../../components/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
} from '../../constants/theme';
import { getChatSessions, type ChatSessionItem } from '../../services/chat.service';

function formatSessionTitle(dateString: string): string {
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `Cuộc trò chuyện ngày ${formatted}`;
}

function formatRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export function ChatHistoryScreen() {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getChatSessions();
      setSessions(data);
    } catch {
      // Silently handle errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSessionPress = useCallback((session: ChatSessionItem) => {
    router.push({
      pathname: '/chat' as never,
      params: { sessionId: session.id },
    });
  }, []);

  return (
    <ScreenContainer
      refreshing={isLoading}
      onRefresh={loadSessions}
      stickyHeaderIndices={[0]}
    >
      <GradientHeader
        title="Lịch sử trò chuyện"
        colors={[figmaColors.primary, figmaColors.primaryDark]}
        leftSlot={
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Quay lại"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </Pressable>
        }
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={figmaColors.primary} />
        </View>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="chat-remove-outline"
          title="Chưa có cuộc trò chuyện nào"
          message="Bắt đầu trò chuyện mới với trợ lý AI sức khỏe."
          action={{
            label: 'Trò chuyện mới',
            onPress: () => router.replace('/chat' as never),
          }}
        />
      ) : (
        <View style={styles.list}>
          {sessions.map((item, index) => (
            <FadeInView key={item.id} delay={index * 60}>
              <Pressable onPress={() => handleSessionPress(item)}>
                <GlassCard style={styles.sessionCard} interactive>
                  <View style={styles.sessionContent}>
                    <View style={styles.sessionIcon}>
                      <MaterialCommunityIcons
                        name="chat-outline"
                        size={24}
                        color={figmaColors.primary}
                      />
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text
                        variant="titleSmall"
                        style={styles.sessionTitle}
                        numberOfLines={1}
                      >
                        {item.title ?? formatSessionTitle(item.updatedAt)}
                      </Text>
                      {item.lastMessage && (
                        <Text
                          variant="bodySmall"
                          style={styles.sessionPreview}
                          numberOfLines={2}
                        >
                          {item.lastMessage.role === 'ASSISTANT' ? 'AI: ' : 'Bạn: '}
                          {item.lastMessage.content}
                        </Text>
                      )}
                      <Text variant="labelSmall" style={styles.sessionDate}>
                        {formatRelative(item.updatedAt)}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color={figmaColors.textMuted}
                    />
                  </View>
                </GlassCard>
              </Pressable>
            </FadeInView>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  sessionCard: {
    borderRadius: figmaRadius.lg,
    marginBottom: 2,
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.pastelBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionTitle: {
    fontWeight: '600',
    color: figmaColors.textPrimary,
    fontSize: figmaFonts.sizes.lg,
  },
  sessionPreview: {
    color: figmaColors.textSecondary,
    lineHeight: 18,
  },
  sessionDate: {
    color: figmaColors.textMuted,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: figmaSpacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
