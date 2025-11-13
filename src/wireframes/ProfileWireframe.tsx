import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../design-system';

export const Profile = ({ user, onEdit }: any) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Image source={require('../assets/avatar.png')} style={styles.avatar} accessibilityLabel="User Avatar" />
      <View style={{ marginLeft: spacing.md }}>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role}</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.editBtn} onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit Profile">
      <Icon name="account-edit" size={28} color={colors.secondary} />
      <Text style={styles.editText}>Edit Profile</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
  },
  name: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  role: {
    ...typography.caption,
    color: colors.secondary,
    marginTop: 2,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.lg,
    elevation: 1,
  },
  editText: {
    ...typography.body,
    color: colors.secondary,
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
});
