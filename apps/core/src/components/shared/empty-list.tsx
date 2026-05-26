import { Button } from 'heroui-native';
import { EmptyState } from 'heroui-native-pro/empty-state';
import type { ReactNode } from 'react';

export interface EmptyListProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onPress?: () => void;
  /** When false, omits flex-1 — use for inline empty areas inside ScrollView. Default true for full-screen empty tabs. */
  fill?: boolean;
}

export function EmptyList({ icon, title, description, ctaLabel, onPress, fill = true }: EmptyListProps) {
  return (
    <EmptyState className={fill ? 'flex-1 items-center justify-center px-8' : 'items-center justify-center px-4 py-8'}>
      <EmptyState.Header className="gap-3">
        <EmptyState.Media variant="icon">{icon}</EmptyState.Media>
        <EmptyState.Title className="text-center">{title}</EmptyState.Title>
        <EmptyState.Description className="text-center">{description}</EmptyState.Description>
      </EmptyState.Header>
      {ctaLabel !== undefined ? (
        <EmptyState.Content className="mt-6">
          <Button variant="secondary" onPress={onPress}>
            <Button.Label>{ctaLabel}</Button.Label>
          </Button>
        </EmptyState.Content>
      ) : null}
    </EmptyState>
  );
}
