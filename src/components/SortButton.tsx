import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from '../../AppText';
import type { Palette } from '../types';

type SortButtonProps = {
  isAscending: boolean;
  onToggle: () => void;
  palette: Palette;
};

function SortButton({ isAscending, onToggle, palette }: SortButtonProps): React.JSX.Element {
  const accessibilityLabel = isAscending
    ? 'Basculer en tri décroissant par numéro de page'
    : 'Basculer en tri croissant par numéro de page';

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Modifier l'ordre de tri des clientes par numéro de page"
        style={({ pressed }) => [
          styles.singleActionButton,
          {
            backgroundColor: palette.actionButtonBackground,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <AppText
          style={[
            styles.singleActionButtonLabel,
            { color: palette.actionButtonText },
          ]}
        >
          {isAscending ? 'Page croissant' : 'Page décroissant'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: 10,
  },
  singleActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  singleActionButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

export default SortButton;
