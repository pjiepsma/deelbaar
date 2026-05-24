import { cn } from "heroui-native";
import { forwardRef } from "react";
import { Text as RNText, type TextProps } from "react-native";

export type AppTextProps = TextProps;

// `font-normal` is placed before the caller's className so that caller-supplied
// weight utilities (`font-medium`, `font-semibold`, etc.) win via tailwind-merge.
// Font-family resolution piggy-backs on the `--font-*` CSS variables in
// `global.css`, which also propagates to heroui-native's own `Text`.
export const AppText = forwardRef<RNText, AppTextProps>(
  ({ className, ...rest }, ref): React.ReactElement => {
    return <RNText ref={ref} className={cn("font-normal", className)} {...rest} />;
  },
);

AppText.displayName = "AppText";
