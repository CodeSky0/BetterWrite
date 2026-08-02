import {
  EducationStageLabels,
  TopicTypeLabels,
  type WritingMaterial,
  WritingMaterialDifficultyLabels,
  WritingMaterialTypeLabels,
} from '@betterwrite/shared';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Clipboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Empty } from '../../../components/ui/Empty';
import { Loading } from '../../../components/ui/Loading';
import { fetcher } from '../../../lib/api/fetcher';
import { useTheme } from '../../../theme/dark-mode';

const PAGE_SIZE = 20;

type FilterKey = 'type' | 'topicType' | 'difficulty' | 'stage';

const filterOptions: Array<{
  key: FilterKey;
  label: string;
  labels: Record<string, string>;
}> = [
  { key: 'type', label: '类型', labels: WritingMaterialTypeLabels as Record<string, string> },
  { key: 'topicType', label: '话题', labels: TopicTypeLabels as Record<string, string> },
  {
    key: 'difficulty',
    label: '难度',
    labels: WritingMaterialDifficultyLabels as Record<string, string>,
  },
  { key: 'stage', label: '学段', labels: EducationStageLabels as Record<string, string> },
];

export default function StudentMaterialsPage() {
  const { colors } = useTheme();

  const [materials, setMaterials] = useState<WritingMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    type: '',
    topicType: '',
    difficulty: '',
    stage: '',
  });
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritingIds, setFavoritingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher
      .getWritingMaterials({
        type: filters.type || undefined,
        topicType: filters.topicType || undefined,
        difficulty: filters.difficulty || undefined,
        stage: filters.stage || undefined,
        keyword: keyword || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setMaterials(res.data.list);
          setTotal(res.data.total);
        } else {
          setError(res.error ?? '获取素材失败');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '获取素材失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, filters.type, filters.topicType, filters.difficulty, filters.stage, keyword]);

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) => {
      const labels = filterOptions.find((o) => o.key === key)?.labels ?? {};
      const keys = Object.keys(labels);
      const idx = keys.indexOf(prev[key]);
      const nextValue = keys[idx + 1] ?? '';
      return { ...prev, [key]: nextValue };
    });
    setPage(1);
  };

  const toggleFavorite = async (material: WritingMaterial) => {
    if (favoritingIds.has(material.id)) return;
    setFavoritingIds((prev) => new Set(prev).add(material.id));
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
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setFavoritingIds((prev) => {
        const next = new Set(prev);
        next.delete(material.id);
        return next;
      });
    }
  };

  const copyContent = async (material: WritingMaterial) => {
    try {
      await Clipboard.setString(material.content);
      if (ToastAndroid) {
        ToastAndroid.show('已复制到剪贴板', ToastAndroid.SHORT);
      }
    } catch {
      // ignore
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const getFilterButtonLabel = (key: FilterKey) => {
    const option = filterOptions.find((o) => o.key === key);
    if (!option) return key;
    const value = filters[key];
    return value ? (option.labels[value] ?? value) : option.label;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>写作素材库</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        按话题、类型、难度筛选并收藏高分表达
      </Text>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterGroup}>
            {filterOptions.map((option) => (
              <Button
                key={option.key}
                title={getFilterButtonLabel(option.key)}
                variant={filters[option.key] ? 'primary' : 'outline'}
                size="sm"
                onPress={() => toggleFilter(option.key)}
                colors={colors}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: colors.textPrimary,
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
            },
          ]}
          value={keyword}
          onChangeText={(text) => {
            setKeyword(text);
            setPage(1);
          }}
          placeholder="搜索标题、内容、标签"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {loading && <Loading colors={colors} />}
      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

      {!loading && materials.length === 0 && (
        <Empty title="暂无素材" description="当前筛选条件下没有符合条件的素材" colors={colors} />
      )}

      {materials.map((m) => (
        <Card key={m.id} colors={colors} style={styles.materialCard}>
          <View style={styles.materialHeader}>
            <View style={styles.badges}>
              <Badge variant="secondary" colors={colors}>
                {WritingMaterialTypeLabels[m.type] ?? m.type}
              </Badge>
              {m.topicType ? (
                <Badge variant="outline" colors={colors}>
                  {TopicTypeLabels[m.topicType as keyof typeof TopicTypeLabels] ?? m.topicType}
                </Badge>
              ) : null}
              <Badge variant="outline" colors={colors}>
                {WritingMaterialDifficultyLabels[m.difficulty] ?? m.difficulty}
              </Badge>
            </View>
            <View style={styles.actions}>
              <Button
                title=""
                variant="ghost"
                size="sm"
                onPress={() => toggleFavorite(m)}
                loading={favoritingIds.has(m.id)}
                colors={colors}
                style={styles.iconButton}
              >
                <Ionicons
                  name={m.isFavorited ? 'heart' : 'heart-outline'}
                  size={22}
                  color={m.isFavorited ? colors.error : colors.textSecondary}
                />
              </Button>
              <Button
                title=""
                variant="ghost"
                size="sm"
                onPress={() => copyContent(m)}
                colors={colors}
                style={styles.iconButton}
              >
                <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
              </Button>
            </View>
          </View>

          <Text style={[styles.materialTitle, { color: colors.textPrimary }]}>{m.title}</Text>
          <Text style={[styles.materialContent, { color: colors.textSecondary }]}>{m.content}</Text>

          {m.tags.length > 0 && (
            <View style={styles.tags}>
              {m.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.bgTertiary }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {m.source ? (
            <Text style={[styles.source, { color: colors.textTertiary }]}>来源：{m.source}</Text>
          ) : null}
        </Card>
      ))}

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <Button
            title="上一页"
            variant="outline"
            size="sm"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            colors={colors}
          />
          <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>
            {page} / {totalPages}
          </Text>
          <Button
            title="下一页"
            variant="outline"
            size="sm"
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            colors={colors}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  filters: {
    marginBottom: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 12,
    fontSize: 15,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  materialCard: {
    marginBottom: 12,
    gap: 10,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
  },
  materialTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  materialContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
  },
  source: {
    fontSize: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  pageInfo: {
    fontSize: 14,
  },
});
