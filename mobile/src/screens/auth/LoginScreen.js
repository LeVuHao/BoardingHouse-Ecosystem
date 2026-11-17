import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (customEmail, customPassword) => {
    const loginEmail = (customEmail || email).trim();
    const loginPass = customPassword || password;

    if (!loginEmail) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email');
      return;
    }
    if (!loginPass) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const res = await login(loginEmail, loginPass);
      if (res.success) {
        // Sau khi đăng nhập thành công, điều hướng về màn hình chính hoặc hồ sơ
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('MainTabs');
        }
      } else {
        Alert.alert('Đăng nhập thất bại', res.message || 'Email hoặc mật khẩu không chính xác');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(demoEmail, demoPass);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Logo */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="home" size={32} color="#6366F1" />
            </View>
            <Text style={styles.brandTitle}>Roomily</Text>
            <Text style={styles.welcomeText}>Chào mừng bạn trở lại! 👋</Text>
            <Text style={styles.subText}>
              Đăng nhập để tìm phòng trọ, quản lý hợp đồng và gửi báo hỏng dễ dàng.
            </Text>
          </View>

          {/* Form Đăng Nhập */}
          <View style={styles.formContainer}>
            {/* Trường Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')}>
                    <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Trường Mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập mật khẩu của bạn"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nút Đăng nhập chính */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={() => handleLogin()}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Tài khoản mẫu test nhanh */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Tài khoản thử nghiệm nhanh (1 chạm):</Text>
              <View style={styles.demoRow}>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleQuickLogin('student@roomily.vn', '123456')}
                  disabled={loading}
                >
                  <Ionicons name="school-outline" size={14} color="#6366F1" />
                  <Text style={styles.demoChipText}>Sinh viên thuê trọ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoChip, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]}
                  onPress={() => handleQuickLogin('landlord@roomily.vn', '123456')}
                  disabled={loading}
                >
                  <Ionicons name="business-outline" size={14} color="#10B981" />
                  <Text style={[styles.demoChipText, { color: '#047857' }]}>Chủ nhà trọ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Chuyển sang Đăng ký */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản Roomily? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  subText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 10,
    textAlign: 'center',
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  demoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
});
