import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Context Quản lý Xác thực & Phiên Đăng nhập (Hùng phụ trách)
import { AuthProvider } from './src/context/AuthContext';

// Màn hình của Võ Gia Huy (Khám phá & Thuê phòng)
import RoomListScreen from './src/screens/rooms/RoomListScreen';
import RoomDetailScreen from './src/screens/rooms/RoomDetailScreen';
import MyContractsScreen from './src/screens/rooms/MyContractsScreen';

// Màn hình của Sang Xuân Hùng (Auth, Profile, Thông báo & Báo hỏng)
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import NotificationsScreen from './src/screens/profile/NotificationsScreen';
import MaintenanceTicketsScreen from './src/screens/profile/MaintenanceTicketsScreen';

// Placeholder Screens cho các thành viên khác
function ForumPlaceholder() {
  return (
    <View style={styles.centerBox}>
      <Ionicons name="chatbubbles" size={48} color="#6366F1" />
      <Text style={styles.placeholderTitle}>Diễn Đàn Ở Ghép & Chat</Text>
      <Text style={styles.placeholderSub}>Phân hệ do Hoàng phụ trách</Text>
    </View>
  );
}

function BillsPlaceholder() {
  return (
    <View style={styles.centerBox}>
      <Ionicons name="receipt" size={48} color="#10B981" />
      <Text style={styles.placeholderTitle}>Hóa Đơn & Thanh Toán VietQR</Text>
      <Text style={styles.placeholderSub}>Phân hệ do Lê Vũ Hảo phụ trách</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigation
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'RoomsTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ContractsTab') {
            iconName = focused ? 'key' : 'key-outline';
          } else if (route.name === 'ForumTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'BillsTab') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="RoomsTab" 
        component={RoomListScreen} 
        options={{ tabBarLabel: 'Khám phá' }} 
      />
      <Tab.Screen 
        name="ContractsTab" 
        component={MyContractsScreen} 
        options={{ tabBarLabel: 'Trọ của tôi' }} 
      />
      <Tab.Screen 
        name="ForumTab" 
        component={ForumPlaceholder} 
        options={{ tabBarLabel: 'Ở ghép' }} 
      />
      <Tab.Screen 
        name="BillsTab" 
        component={BillsPlaceholder} 
        options={{ tabBarLabel: 'Hóa đơn' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Tài khoản' }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Main Tab Screen */}
          <Stack.Screen name="MainTabs" component={MainTabs} />
          
          {/* Màn hình Xác thực (Auth) */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ presentation: 'modal' }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
          />

          {/* Màn hình Thông báo & Báo hỏng */}
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen} 
          />
          <Stack.Screen 
            name="MaintenanceTickets" 
            component={MaintenanceTicketsScreen} 
          />

          {/* Màn hình Chi tiết phòng (Huy phụ trách) */}
          <Stack.Screen 
            name="RoomDetail" 
            component={RoomDetailScreen} 
            options={{ headerShown: false }} 
          />

          {/* Trọ của tôi (Huy phụ trách) */}
          <Stack.Screen 
            name="MyContracts" 
            component={MyContractsScreen} 
            options={{ headerShown: false }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  placeholderSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
});
