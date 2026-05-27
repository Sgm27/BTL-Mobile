/**
 * SearchBar - Pill-shaped search bar with icon + placeholder
 * Matches Figma `div.search-bar` pattern.
 * Can be used as a tappable navigation entry (Pressable) or as an actual TextInput.
 */
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { figmaColors, figmaFonts, figmaRadius } from '../../constants/theme';

interface SearchBarProps {
  placeholder?: string;
  /** If provided, renders as a TextInput. */
  value?: string;
  onChangeText?: (text: string) => void;
  /** If provided, renders as a Pressable that navigates somewhere. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SearchBar({
  placeholder = 'Tìm bác sĩ, chuyên khoa...',
  value,
  onChangeText,
  onPress,
  style,
}: SearchBarProps) {
  const isInteractive = typeof value === 'string' || typeof onChangeText === 'function';

  if (isInteractive) {
    return (
      <View style={[styles.wrap, style]}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          value={value ?? ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={figmaColors.textMuted}
          style={styles.input}
        />
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.wrap, style]}>
      <Text style={styles.icon}>🔍</Text>
      <Text style={styles.placeholder}>{placeholder}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: figmaColors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: figmaRadius.pill,
  },
  icon: {
    fontSize: 18,
    color: figmaColors.textMuted,
  },
  placeholder: {
    flex: 1,
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textMuted,
  },
  input: {
    flex: 1,
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textPrimary,
    padding: 0,
  },
});
