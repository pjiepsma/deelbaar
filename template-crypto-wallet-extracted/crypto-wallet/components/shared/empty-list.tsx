import { Button } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { type ReactNode } from "react";

export interface EmptyListProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onPress?: () => void;
}

export const EmptyList = ({
  icon,
  title,
  description,
  ctaLabel,
  onPress,
}: EmptyListProps): React.ReactElement => {
  return (
    <EmptyState className="flex-1 items-center justify-center px-8">
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
};
