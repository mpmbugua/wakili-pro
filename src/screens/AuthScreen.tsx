import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { login, register, forgotPassword, resetPassword } from '../../shared/api';

  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        const res = await login(email, password);
        Alert.alert('Login Success', `Welcome ${res.user.firstName}`);
        // TODO: Navigate to dashboard
      } else {
        const res = await register(firstName, lastName, email, password);
        Alert.alert('Registration Success', `Welcome ${res.user.firstName}`);
        // TODO: Navigate to dashboard
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert('Success', 'Password reset link sent to your email.');
      setShowForgot(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      Alert.alert('Success', 'Password reset successful. You can now log in.');
      setShowReset(false);
      setIsLogin(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!showForgot && !showReset && (
        <>
          <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>
          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
            </>
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button title={loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'} onPress={handleAuth} disabled={loading} />
          {isLogin && (
            <Text style={styles.link} onPress={() => setShowForgot(true)}>
              Forgot password?
            </Text>
          )}
          <Text style={styles.switch} onPress={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </Text>
        </>
      )}
      {showForgot && (
        <>
          <Text style={styles.title}>Forgot Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button title={loading ? 'Please wait...' : 'Send Reset Link'} onPress={handleForgotPassword} disabled={loading} />
          <Text style={styles.link} onPress={() => setShowForgot(false)}>
            Back to Login
          </Text>
          <Text style={styles.link} onPress={() => setShowReset(true)}>
            Already have a reset token?
          </Text>
        </>
      )}
      {showReset && (
        <>
          <Text style={styles.title}>Reset Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Reset Token"
            value={resetToken}
            onChangeText={setResetToken}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Button title={loading ? 'Please wait...' : 'Reset Password'} onPress={handleResetPassword} disabled={loading} />
          <Text style={styles.link} onPress={() => setShowReset(false)}>
            Back to Login
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  switch: { color: '#007bff', marginTop: 16, textAlign: 'center' },
  link: { color: '#007bff', marginTop: 12, textAlign: 'center', textDecorationLine: 'underline' },
});
