import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../design-system';

export const Dashboard = ({ user, onNavigate }: any) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Image source={require('../assets/logo.png')} style={styles.logo} accessibilityLabel="Wakili Pro Logo" />
      <Text style={styles.greeting}>Hello, {user?.firstName || 'User'}!</Text>
    </View>
    <View style={styles.statsRow}>
      <View style={styles.statCard} accessibilityRole="summary">
        <Icon name="briefcase" size={32} color={colors.primary} accessibilityLabel="Total Cases" />
        <Text style={styles.statLabel}>Total Cases</Text>
        <Text style={styles.statValue}>{user?.stats?.totalCases ?? '--'}</Text>
      </View>
      <View style={styles.statCard} accessibilityRole="summary">
        <Icon name="account-group" size={32} color={colors.primary} accessibilityLabel="Active Consultations" />
        <Text style={styles.statLabel}>Active Consultations</Text>
        <Text style={styles.statValue}>{user?.stats?.activeConsultations ?? '--'}</Text>
      </View>
    </View>
    <View style={styles.quickLinks}>
      <Text style={styles.quickLinksTitle}>Quick Links</Text>
      <View style={styles.linksRow}>
        <TouchableOpacity style={styles.linkBtn} onPress={() => onNavigate('Cases')} accessibilityRole="button" accessibilityLabel="Go to Cases">
          <Icon name="folder-account" size={28} color={colors.secondary} />
          <Text style={styles.linkText}>Cases</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => onNavigate('Calendar')} accessibilityRole="button" accessibilityLabel="Go to Calendar">
          <Icon name="calendar" size={28} color={colors.secondary} />
          <Text style={styles.linkText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => onNavigate('Billing')} accessibilityRole="button" accessibilityLabel="Go to Billing">
          <Icon name="credit-card" size={28} color={colors.secondary} />
          <Text style={styles.linkText}>Billing</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  logo: {
    width: 40,
    height: 40,
    marginRight: spacing.md,
    resizeMode: 'contain',
  },
  greeting: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    elevation: 2,
    flex: 1,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
    minWidth: 120,
  },
  statLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '700',
  },
  quickLinks: {
    marginTop: spacing.lg,
  },
  quickLinksTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkBtn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 8,
    elevation: 1,
  },
  linkText: {
    ...typography.body,
    color: colors.secondary,
    marginTop: 2,
  },
});
