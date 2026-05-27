/**
 * ListRow - Generic list item with leading icon, title/subtitle, optional trailing
 * Uses MaterialCommunityIcons instead of emoji for consistent styling.
 */
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { figmaColors, figmaFonts, figmaRadius } from '../../constants/theme';

type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ListRowProps {
  icon?: MCIconName;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  trailing?: string;
  trailingColor?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ListRow({
  icon,
  iconBgColor = figmaColors.pastelBlue,
  iconColor = figmaColors.primary,
  title,
  subtitle,
  trailing = '›',
  trailingColor = figmaColors.textMuted,
  onPress,
  style,
}: ListRowProps) {
  return (
    <Pressable
      onPress={() => {
        console.log('[ListRow] press:', title);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.row,
        style,
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
      ) : null}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={trailingColor} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.6,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: figmaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.medium,
    color: figmaColors.textPrimary,
  },
  subtitle: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
  },
});
