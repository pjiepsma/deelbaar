import { Toast, type ToastComponentProps } from "heroui-native";
import { View } from "react-native";
import { LinearTransition } from "react-native-reanimated";

import { SingleColorIcon } from "@/components/icons/single-color";

export interface CopyAddressToastProps extends ToastComponentProps {
  description?: string;
  label?: string;
}

export const CopyAddressToast = ({
  label = "Address copied",
  description,
  ...toastProps
}: CopyAddressToastProps): React.ReactElement => {
  return (
    <Toast
      // `layout` is forwarded to the underlying Animated.View, but upstream
      // typings don't surface it yet.
      // @ts-expect-error - layout is forwarded to Animated.View
      layout={LinearTransition.springify().mass(2)}
      className="mx-auto flex-row items-center gap-3 rounded-full p-2 pr-4 bg-background-inverse"
      variant="default"
      {...toastProps}
    >
      <View className="flex-row items-center gap-2.5">
        <View className="size-7 items-center justify-center rounded-full bg-success-soft">
          <SingleColorIcon name="check" size={18} colorClassName="accent-success" />
        </View>
        <View className="shrink">
          <Toast.Title className="text-sm font-semibold text-background" maxFontSizeMultiplier={1}>
            {label}
          </Toast.Title>
          {description !== undefined ? (
            <Toast.Description className="text-xs text-background/60" maxFontSizeMultiplier={1}>
              {description}
            </Toast.Description>
          ) : null}
        </View>
      </View>
    </Toast>
  );
};
