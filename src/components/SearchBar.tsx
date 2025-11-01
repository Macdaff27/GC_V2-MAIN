import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { Palette } from '../types';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  palette: Palette;
};

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, palette }) => (
  <View
    style={[
      styles.searchContainer,
      {
        backgroundColor: palette.searchBackground,
        borderColor: palette.surfaceBorder,
      },
    ]}
  >
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={[styles.searchInput, { color: palette.textPrimary }]}
      placeholder="Filtrer par nom, page ou note..."
      placeholderTextColor={palette.searchPlaceholder}
      selectionColor={palette.accent}
      returnKeyType="search"
      accessibilityLabel="Barre de recherche des clientes"
    />
  </View>
);

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default SearchBar;
