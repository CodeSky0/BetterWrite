import { fetcher } from '@/lib/api/fetcher';
import {
  type EducationStageValue,
  TopicTypeLabels,
  type TopicTypeValue,
  type WritingMaterial,
  WritingMaterialDifficultyLabels,
  type WritingMaterialDifficultyValue,
  WritingMaterialTypeLabels,
  type WritingMaterialTypeValue,
} from '@betterwrite/shared';
import { Heart, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ThemeColors } from '../../theme/tokens';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '../../theme/tokens';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface MaterialSheetProps {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  stage?: EducationStageValue;
  topicType?: TopicTypeValue;
  onQuote: (content: string) => void;
}

const PAGE_SIZE = 20;

export function MaterialSheet({
  visible,
  onClose,
  colors,
  stage,
  topicType,
  onQuote,
}: MaterialSheetProps) {
  const [materials, setMaterials] = useState<WritingMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<WritingMaterialTypeValue | ''>('');
  const [difficulty, setDifficulty] = useState<WritingMaterialDifficultyValue | ''>('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher.getWritingMaterials({
        type: type || undefined,
        topicType,
        stage,
        difficulty: difficulty || undefined,
        keyword: keyword || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setMaterials(res.data.list);
        setTotal(res.data.total);
      } else {
        setError(res.error ?? '获取素材失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取素材失败');
    } finally {
      setLoading(false);
    }
  }, [type, topicType, stage, difficulty, keyword, page]);

  useEffect(() => {
    if (!visible) return;
    loadMaterials();
  }, [visible, loadMaterials]);

  const toggleFavorite = async (material: WritingMaterial) => {
    try {
      const res = material.isFavorited
        ? await fetcher.unfavoriteWritingMaterial(material.id)
        : await fetcher.favoriteWritingMaterial(material.id);
      if (res.success && res.data) {
        const nextFavorited = res.data.isFavorited;
        setMaterials((prev) =>
          prev.map((m) => (m.id === material.id ? { ...m, isFavorited: nextFavorited } : m)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作收藏失败');
    }
  };

  const handleQuote = (material: WritingMaterial) => {
    onQuote(material.content);
  };

  const resetFilters = () => {
    setType('');
    setDifficulty('');
    setKeyword('');
    setPage(1);
  };

  const hasMore = page * PAGE_SIZE < total;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.bgPrimary }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>写作素材库</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            <View style={[styles.search, { backgroundColor: colors.bgSecondary }]}>
              <Search size={16} color={colors.textTertiary} />
              <TextInput
                value={keyword}
                onChangeText={(text) => {
                  setKeyword(text);
                  setPage(1);
                }}
                placeholder="搜索素材"
                placeholderTextColor={colors.textTertiary}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {Object.entries(WritingMaterialTypeLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    setType((prev) => (prev === key ? '' : (key as WritingMaterialTypeValue)));
                    setPage(1);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: type === key ? colors.accentLight : colors.bgSecondary,
                      borderColor: type === key ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: type === key ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {Object.entries(WritingMaterialDifficultyLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    setDifficulty((prev) =>
                      prev === key ? '' : (key as WritingMaterialDifficultyValue),
                    );
                    setPage(1);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: difficulty === key ? colors.accentLight : colors.bgSecondary,
                      borderColor: difficulty === key ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: difficulty === key ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {(type || difficulty || keyword) && (
            <TouchableOpacity onPress={resetFilters} style={styles.resetRow}>
              <Text style={[styles.resetText, { color: colors.accent }]}>重置筛选</Text>
            </TouchableOpacity>
          )}

          {loading && materials.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : materials.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>暂无素材</Text>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {materials.map((material) => (
                <Card key={material.id} colors={colors} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <View style={styles.badgeRow}>
                      <Badge variant="secondary" colors={colors}>
                        {WritingMaterialTypeLabels[material.type]}
                      </Badge>
                      {material.difficulty && (
                        <Badge variant="outline" colors={colors}>
                          {WritingMaterialDifficultyLabels[material.difficulty]}
                        </Badge>
                      )}
                      {material.topicType && (
                        <Badge variant="outline" colors={colors}>
                          {TopicTypeLabels[material.topicType as keyof typeof TopicTypeLabels]}
                        </Badge>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => toggleFavorite(material)}>
                      <Heart
                        size={18}
                        color={material.isFavorited ? colors.error : colors.textTertiary}
                        fill={material.isFavorited ? colors.error : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.content, { color: colors.textPrimary }]}>
                    {material.content}
                  </Text>
                  {material.title ? (
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                      {material.title}
                    </Text>
                  ) : null}
                  <View style={styles.itemFooter}>
                    <Button
                      title="引用到作文"
                      size="sm"
                      onPress={() => handleQuote(material)}
                      colors={colors}
                    />
                  </View>
                </Card>
              ))}

              {total > PAGE_SIZE && (
                <View style={styles.pagination}>
                  <Button
                    title="上一页"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onPress={() => setPage((p) => p - 1)}
                    colors={colors}
                  />
                  <Text style={[styles.pageText, { color: colors.textSecondary }]}>
                    {page} / {Math.ceil(total / PAGE_SIZE)}
                  </Text>
                  <Button
                    title="下一页"
                    variant="outline"
                    size="sm"
                    disabled={!hasMore}
                    onPress={() => setPage((p) => p + 1)}
                    colors={colors}
                  />
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    height: '78%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  title: {
    fontSize: fontSizes.title20,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.title20,
  },
  closeBtn: {
    padding: spacing[2],
  },
  filterRow: {
    marginBottom: spacing[3],
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.copy15,
    lineHeight: lineHeights.copy15,
  },
  chipScroll: {
    marginBottom: spacing[2],
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSizes.copy13,
    lineHeight: lineHeights.copy13,
    fontWeight: fontWeights.medium,
  },
  resetRow: {
    alignSelf: 'flex-start',
    marginBottom: spacing[3],
  },
  resetText: {
    fontSize: fontSizes.copy14,
    lineHeight: lineHeights.copy14,
    fontWeight: fontWeights.medium,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: spacing[6],
    fontSize: fontSizes.copy14,
    lineHeight: lineHeights.copy14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing[6],
    fontSize: fontSizes.copy14,
    lineHeight: lineHeights.copy14,
  },
  list: {
    flex: 1,
  },
  item: {
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    flex: 1,
  },
  content: {
    fontSize: fontSizes.copy15,
    lineHeight: lineHeights.copy15,
  },
  subtitle: {
    fontSize: fontSizes.copy13,
    lineHeight: lineHeights.copy13,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing[1],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  pageText: {
    fontSize: fontSizes.copy13,
    lineHeight: lineHeights.copy13,
  },
});
