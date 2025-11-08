# NativeWind & Gluestack UI Setup Guide

## ✅ Installation Complete

Both NativeWind and Gluestack UI have been successfully installed and configured in your project!

## 📦 What Was Installed

### NativeWind
- `nativewind@4.2.1` - Tailwind CSS for React Native
- `tailwindcss@3.4.17` - Tailwind CSS framework
- `react-native-css-interop@0.2.1` - CSS interoperability

### Gluestack UI
- `@gluestack-ui/themed` - Themed UI components
- `@gluestack-ui/config` - Default configuration
- `@gluestack-style/react` - Styling engine
- `react-native-svg` - SVG support

## 🔧 Configuration Files

### Files Created/Modified:
1. **`tailwind.config.js`** - Tailwind configuration with custom colors
2. **`global.css`** - Tailwind directives
3. **`gluestack-ui.config.ts`** - Gluestack UI theme configuration
4. **`nativewind-env.d.ts`** - TypeScript support for NativeWind
5. **`metro.config.js`** - Updated with NativeWind Metro config (NativeWind v4 uses Metro, not Babel)
6. **`app/_layout.tsx`** - Added providers for both libraries

## 🚀 Usage Examples

### Using NativeWind (Tailwind CSS)

```tsx
import { View, Text } from 'react-native';

export default function Example() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-2xl font-bold text-primary">
        Hello NativeWind!
      </Text>
      <View className="mt-4 p-4 bg-white rounded-lg shadow-md">
        <Text className="text-gray-700">
          This is styled with Tailwind CSS!
        </Text>
      </View>
    </View>
  );
}
```

### Using Gluestack UI Components

```tsx
import { Button, ButtonText } from '@gluestack-ui/themed';
import { Box } from '@gluestack-ui/themed';
import { Text } from '@gluestack-ui/themed';
import { Input, InputField } from '@gluestack-ui/themed';

export default function GluestackExample() {
  return (
    <Box p="$4" bg="$white">
      <Text fontSize="$2xl" fontWeight="$bold" mb="$4">
        Gluestack UI Components
      </Text>
      
      <Input mb="$4">
        <InputField placeholder="Enter your name" />
      </Input>
      
      <Button size="md" variant="solid" action="primary">
        <ButtonText>Click Me</ButtonText>
      </Button>
    </Box>
  );
}
```

### Combining Both Libraries

```tsx
import { View } from 'react-native';
import { Button, ButtonText, Box, Text } from '@gluestack-ui/themed';

export default function CombinedExample() {
  return (
    <View className="flex-1 p-4 bg-gray-50">
      {/* Gluestack UI components inside NativeWind styled View */}
      <Box className="mb-4">
        <Text fontSize="$xl" fontWeight="$bold">
          Best of Both Worlds!
        </Text>
      </Box>
      
      <View className="bg-white rounded-lg p-4 shadow-sm">
        <Button>
          <ButtonText>Gluestack Button in Tailwind Container</ButtonText>
        </Button>
      </View>
    </View>
  );
}
```

## 🎨 Available Gluestack UI Components

Here are some commonly used components:

- **Layout**: `Box`, `Center`, `HStack`, `VStack`, `Divider`
- **Forms**: `Button`, `Input`, `Checkbox`, `Radio`, `Select`, `Switch`, `Textarea`
- **Feedback**: `Alert`, `Progress`, `Spinner`, `Toast`
- **Data Display**: `Avatar`, `Badge`, `Card`, `Image`
- **Overlay**: `Modal`, `AlertDialog`, `Popover`, `Tooltip`
- **Typography**: `Heading`, `Text`

## 📚 Tailwind Classes

You can use all standard Tailwind CSS classes with NativeWind. Custom colors defined in `tailwind.config.js`:

- `text-primary` / `bg-primary`
- `text-secondary` / `bg-secondary`
- `text-success` / `bg-success`
- `text-warning` / `bg-warning`
- `text-danger` / `bg-danger`
- `text-info` / `bg-info`

## 🔄 Next Steps

1. **Clear cache and rebuild**:
   ```bash
   yarn start --clear
   ```

2. **Import components** as shown in the examples above

3. **Explore Gluestack UI docs**: https://ui.gluestack.io/
4. **Explore NativeWind docs**: https://www.nativewind.dev/

## 💡 Tips

1. **NativeWind** is great for utility-first styling and rapid prototyping
2. **Gluestack UI** provides pre-built accessible components with consistent design
3. You can mix both approaches - use Gluestack components with NativeWind classes
4. TypeScript autocomplete works for both libraries

## 🐛 Troubleshooting

If you encounter issues:

1. **Clear Metro cache**: `yarn start --clear`
2. **Rebuild the app**: Stop the dev server and restart
3. **Check imports**: Make sure you're importing from the correct packages
4. **Check className vs style**: NativeWind uses `className`, not `style` for Tailwind classes

## 📖 Documentation Links

- [NativeWind Documentation](https://www.nativewind.dev/)
- [Gluestack UI Documentation](https://ui.gluestack.io/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

Happy coding! 🎉

