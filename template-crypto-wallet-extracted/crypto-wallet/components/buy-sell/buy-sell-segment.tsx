import { Segment } from "heroui-native-pro";

export type BuySellMode = "buy" | "sell";

export interface BuySellSegmentProps {
  value: BuySellMode;
  onValueChange: (mode: BuySellMode) => void;
}

interface SegmentOption {
  value: BuySellMode;
  label: string;
}

const MODES: readonly SegmentOption[] = [
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
];

const isBuySellMode = (value: string): value is BuySellMode => {
  return MODES.some((option) => option.value === value);
};

export const BuySellSegment = ({
  value,
  onValueChange,
}: BuySellSegmentProps): React.ReactElement => {
  const handleChange = (next: string): void => {
    if (isBuySellMode(next)) {
      onValueChange(next);
    }
  };

  return (
    <Segment value={value} onValueChange={handleChange} size="sm">
      <Segment.Group>
        <Segment.Indicator />
        {MODES.map((option) => (
          <Segment.Item key={option.value} value={option.value}>
            <Segment.Label>{option.label}</Segment.Label>
          </Segment.Item>
        ))}
      </Segment.Group>
    </Segment>
  );
};
