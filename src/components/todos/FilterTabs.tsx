import { StyleSheet, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { spacing } from '@/theme';
import type { TodoStatus } from '@/api/todos.api';

type Props = {
  value: TodoStatus;
  onChange: (status: TodoStatus) => void;
};

const TABS: { label: string; value: TodoStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

export function FilterTabs({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {TABS.map((tab) => (
        <Badge
          key={tab.value}
          label={tab.label}
          selected={value === tab.value}
          onPress={() => onChange(tab.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing[2] },
});
