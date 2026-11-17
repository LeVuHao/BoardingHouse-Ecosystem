import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Màn hình của Võ Gia Huy
import RoomListScreen from './src/screens/rooms/RoomListScreen';
import RoomDetailScreen from './src/screens/rooms/RoomDetailScreen';
import MyContractsScreen from './src/screens/rooms/MyContractsScreen';

// Placeholder Screens cho các thành viên khác để app chạy trơn tru
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

function ProfilePlaceholder() {
  return (
    <View style={styles.centerBox}>
      <Ionicons name="person-circle" size={48} color="#F59E0B" />
      <Text style={styles.placeholderTitle}>Hồ Sơ, Thông Báo & Báo Hỏng</Text>
      <Text style={styles.placeholderSub}>Phân hệ do Hùng phụ trách</Text>
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
        component={ProfilePlaceholder} 
        options={{ tabBarLabel: 'Tài khoản' }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main Tab Screen */}
        <Stack.Screen name="MainTabs" component={MainTabs} />
        
        {/* Chi tiết phòng (Huy phụ trách) */}
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
