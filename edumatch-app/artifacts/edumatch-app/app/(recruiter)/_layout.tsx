import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Briefcase, CircleUserRound, LayoutDashboard, Users } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="jobs">
        <Icon sf={{ default: "briefcase", selected: "briefcase.fill" }} />
        <Label>My Jobs</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="candidates">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Candidates</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7c3aed",
        tabBarInactiveTintColor: "#8b7dc0",
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Inter_600SemiBold", marginBottom: isWeb ? 0 : 4 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e0f8",
          elevation: 0,
          height: isWeb ? 84 : 72,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={95} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#ffffff" }]} />
          ),
      }}
    >
      <Tabs.Screen name="index" options={{
        title: "Dashboard",
        tabBarIcon: ({ color, focused }) => isIOS
          ? <SymbolView name={focused ? "square.grid.2x2.fill" : "square.grid.2x2"} tintColor={color} size={24} />
          : <LayoutDashboard size={22} color={color} fill={focused ? color : "none"} />,
      }} />
      <Tabs.Screen name="jobs" options={{
        title: "My Jobs",
        tabBarIcon: ({ color, focused }) => isIOS
          ? <SymbolView name={focused ? "briefcase.fill" : "briefcase"} tintColor={color} size={24} />
          : <Briefcase size={22} color={color} fill={focused ? color : "none"} />,
      }} />
      <Tabs.Screen name="candidates" options={{
        title: "Candidates",
        tabBarIcon: ({ color, focused }) => isIOS
          ? <SymbolView name={focused ? "person.2.fill" : "person.2"} tintColor={color} size={24} />
          : <Users size={22} color={color} fill={focused ? color : "none"} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: "Profile",
        tabBarIcon: ({ color, focused }) => isIOS
          ? <SymbolView name={focused ? "person.circle.fill" : "person.circle"} tintColor={color} size={24} />
          : <CircleUserRound size={22} color={color} fill={focused ? color : "none"} />,
      }} />
    </Tabs>
  );
}

export default function RecruiterTabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
