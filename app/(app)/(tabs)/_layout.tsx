import { Tabs } from 'expo-router';
import {
  Bell,
  ClipboardList,
  Home,
  LayoutGrid,
  PackageSearch,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.maroon,
        headerTitleStyle: { fontWeight: '700', color: colors.maroon },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.maroon,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: '#fff',
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 26} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notice Board',
          tabBarLabel: 'Notices',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size ?? 26} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catalog',
          tabBarLabel: 'Catalog',
          tabBarIcon: ({ color, size }) => <PackageSearch color={color} size={size ?? 26} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarLabel: 'Sales',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size ?? 26} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size ?? 26} />,
        }}
      />
    </Tabs>
  );
}
