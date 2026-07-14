# Todo Elephant Mobile App Guide

This guide shows you how to package Todo Elephant as a mobile app using Expo (React Native).

## Why Expo?

- Single codebase for iOS, Android, and Web
- Native camera, reminders, and push notifications
- Easy deployment to app stores
- Works with your existing React components

## Setup

1. **Install Expo CLI**
```bash
npm install -g expo-cli
```

2. **Create the mobile project**
```bash
cd ..
npx create-expo-app TodoElephantMobile --template
cd TodoElephantMobile
```

3. **Install dependencies**
```bash
npx expo install react-native-gesture-handler react-native-reanimated
npm install @tanstack/react-query lucide-react-native
```

4. **Configure navigation** - Create `src/navigation/AppNavigator.tsx`:
```tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { TasksScreen } from '../screens/TasksScreen';

const Stack = createStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={HomeScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
    </Stack.Navigator>
  );
}
```

5. **Add push notifications** - Create `src/services/notifications.ts`:
```tsx
import * as Notifications from 'expo-notifications';

export async function scheduleTaskReminder(taskId: number, title: string, date: Date) {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🐘 Todo Elephant Reminder',
      body: title,
      data: { taskId },
    },
    trigger: date,
  });
  return identifier;
}

export async function registerForNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}
```

6. **Build for production**
```bash
eas build --platform ios
eas build --platform android
```

## Key Differences from Web

- Replace `div` with `View`, `span` with `Text`
- Use `TouchableOpacity` instead of `button`
- Add SafeAreaProvider for notches
- Replace Tailwind with NativeWind or StyleSheet

## Features to Prioritize

1. **Offline sync** - Tasks work without internet
2. **Push notifications** - Reminders and streak alerts
3. **Haptic feedback** - Celebrate completed tasks
4. **Camera integration** - Capture whiteboard notes
5. **Voice input** - Quick task entry with Siri

## Deploy to App Stores

1. **Apple App Store**
```bash
eas submit --platform ios
```

2. **Google Play Store**
```bash
eas submit --platform android
```

Check Expo documentation for full setup details.