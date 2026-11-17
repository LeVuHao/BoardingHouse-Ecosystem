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

export default function RegisterScreen({ navigation }) {
  const { register, login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validate
    if (!fullName.trim()) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng nhập họ và tên của bạn');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng nhập địa chỉ email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Lỗi nhập liệu', 'Địa chỉ email không đúng định dạng');
      return;
    }
    if (!password) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi nhập liệu', 'Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi nhập liệu', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || null,
        password,
      });

      if (res.success) {
        Alert.alert(
          'Đăng ký thành công 🎉',
          'Tài khoản của bạn đã được khởi tạo. Đang tự động đăng nhập...',
          [
            {
              text: 'Bắt đầu ngay',
              onPress: async () => {
                await login(email.trim(), password);
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('MainTabs');
                }
              },
            },
          ]
        );
        // Tự động đăng nhập
        await login(email.trim(), password);
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('MainTabs');
        }
      } else {
        Alert.alert('Đăng ký thất bại', res.message || 'Không thể tạo tài khoản, vui lòng thử lại');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
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
          {/* Nút quay lại */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Tạo tài khoản mới</Text>
            <Text style={styles.subtitle}>
              Trải nghiệm hệ sinh thái phòng trọ sinh viên tiện lợi và an toàn cùng Roomily
            </Text>
          </View>

          {/* Form đăng ký */}
          <View style={styles.formContainer}>
            {/* Họ và tên */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Địa chỉ Email *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="sinhvien@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Số điện thoại */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="0912 345 678"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            </View>

            {/* Mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu (tối thiểu 6 ký tự) *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập mật khẩu"
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

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Xác nhận lại mật khẩu *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Nút Đăng ký */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký tài khoản</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quay lại Đăng nhập */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn đã có tài khoản Roomily? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
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
  registerButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.65,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
});
