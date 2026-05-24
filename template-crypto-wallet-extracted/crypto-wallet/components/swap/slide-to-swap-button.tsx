import { SlideButton } from "heroui-native-pro";

export interface SlideToSwapButtonProps {
  onPress: () => void;
  isEnabled: boolean;
}

export const SlideToSwapButton = ({
  onPress,
  isEnabled,
}: SlideToSwapButtonProps): React.ReactElement => {
  return (
    <SlideButton
      variant="accent"
      isDisabled={!isEnabled}
      onComplete={onPress}
      autoReset
      autoResetDelay={1500}
    >
      <SlideButton.UnderlayContent>
        <SlideButton.Label>Slide to Swap</SlideButton.Label>
      </SlideButton.UnderlayContent>
      <SlideButton.OverlayContent className="bg-accent">
        <SlideButton.Label className="text-accent-foreground">Swapping...</SlideButton.Label>
      </SlideButton.OverlayContent>
      <SlideButton.Thumb />
    </SlideButton>
  );
};
