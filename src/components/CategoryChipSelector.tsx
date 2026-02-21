import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface Category {
  _id: string;
  name: string;
  color: string;
}

interface CategoryChipSelectorProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
}

export default function CategoryChipSelector({
  categories,
  selectedId,
  onSelect,
  onCreateNew,
  placeholder = 'Search categories...',
}: CategoryChipSelectorProps) {
  const [search, setSearch] = useState('');

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const showCreate =
    !!onCreateNew &&
    search.trim().length > 0 &&
    !categories.some((c) => c.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <View>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
      />
      <View style={styles.chipsWrap}>
        {filtered.map((cat) => {
          const isSelected = cat._id === selectedId;
          return (
            <TouchableOpacity
              key={cat._id}
              style={[
                styles.chip,
                isSelected
                  ? { backgroundColor: cat.color }
                  : { borderColor: cat.color, borderWidth: 1.5 },
              ]}
              onPress={() => onSelect(cat._id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#ffffff' : cat.color },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        {showCreate && (
          <TouchableOpacity
            style={styles.createChip}
            onPress={() => {
              onCreateNew!(search.trim());
              setSearch('');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.createChipText}>+ Create "{search.trim()}"</Text>
          </TouchableOpacity>
        )}
        {filtered.length === 0 && !showCreate && (
          <Text style={styles.noResults}>No categories found</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginBottom: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  createChipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  noResults: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
  },
});
