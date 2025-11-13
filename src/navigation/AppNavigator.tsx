// import AdminDashboardScreen from '../screens/AdminDashboardScreen';
// import UserManagementScreen from '../screens/UserManagementScreen';
// import SystemAnalyticsScreen from '../screens/SystemAnalyticsScreen';
// import SystemSettingsScreen from '../screens/SystemSettingsScreen';
// import SettingsScreen from '../screens/SettingsScreen';
// import AppointmentListScreen from '../screens/AppointmentListScreen';
// import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
// import AppointmentCreateScreen from '../screens/AppointmentCreateScreen';
// import InvoiceListScreen from '../screens/InvoiceListScreen';
// import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';
// import ChatListScreen from '../screens/ChatListScreen';
// import ChatDetailScreen from '../screens/ChatDetailScreen';
// import NotificationsScreen from '../screens/NotificationsScreen';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import { CaseListScreen, CaseDetailScreen } from '../screens/CaseScreens';
import { CaseCreateScreen, CaseEditScreen } from '../screens/CaseEditCreateScreens';
import { CalendarScreen, EventCreateScreen } from '../screens/CalendarScreens';
import { BillingScreen, InvoiceDetailScreen } from '../screens/BillingScreens';
import { DocumentListScreen, DocumentUploadScreen } from '../screens/DocumentScreens';
import NotificationsScreen from '../screens/NotificationsScreen';
import { ChatListScreen, ChatDetailScreen } from '../screens/ChatScreens';
import { ProfileScreen, ProfileEditScreen } from '../screens/ProfileScreens';
import { RoleAccessScreen } from '../screens/RoleAccessScreen';

export type RootStackParamList = {
  Billing: { token: string };
  RoleAccess: { token: string };
  ProfileEdit: { user: any };
  Auth: undefined;
  Dashboard: { token: string; user: any };
  Analytics: { token: string };
  Profile: { user: any };
  CaseList: { token: string };
  CaseDetail: { token: string; caseId: string };
  CaseCreate: { token: string };
  CaseEdit: { token: string; caseId: string };
  Notifications: { token: string };
  ChatList: { token: string };
  ChatDetail: { token: string; chatId: string };
  InvoiceList: { token: string };
  InvoiceDetail: { token: string; invoiceId: string };
  AppointmentList: { token: string };
  AppointmentDetail: { token: string; appointmentId: string };
  AppointmentCreate: { token: string };
  Settings: undefined;
  DocumentList: { token: string };
  DocumentUpload: { token: string };
  Calendar: { token: string };
  EventCreate: { token: string };
  AdminDashboard: undefined;
  UserManagement: undefined;
  SystemAnalytics: undefined;
  SystemSettings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        <Stack.Screen name="CaseList" component={CaseListScreen} options={{ title: 'Cases' }} />
        <Stack.Screen name="CaseDetail" component={CaseDetailScreen} options={{ title: 'Case Details' }} />
        <Stack.Screen name="CaseCreate" component={CaseCreateScreen} options={{ title: 'Create Case' }} />
        <Stack.Screen name="CaseEdit" component={CaseEditScreen} options={{ title: 'Edit Case' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats' }} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ title: 'Chat Detail' }} />
        <Stack.Screen name="DocumentList" component={DocumentListScreen} options={{ title: 'Documents' }} />
        <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ title: 'Upload Document' }} />
        <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
        <Stack.Screen name="EventCreate" component={EventCreateScreen} options={{ title: 'Create Event' }} />
        <Stack.Screen name="Billing" component={BillingScreen} options={{ title: 'Billing' }} />
        <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Invoice Detail' }} />
        <Stack.Screen name="RoleAccess" component={RoleAccessScreen} options={{ title: 'Role-Based Access' }} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: 'Edit Profile' }} />
    {/* <Stack.Screen name="InvoiceList" component={InvoiceListScreen} options={{ title: 'Invoices' }} /> */}
    {/* <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Invoice Detail' }} /> */}
    {/* <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ title: 'Appointments' }} /> */}
    {/* <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment Detail' }} /> */}
    {/* <Stack.Screen name="AppointmentCreate" component={AppointmentCreateScreen} options={{ title: 'Create Appointment' }} /> */}
    {/* <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} /> */}
    {/* <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} /> */}
    {/* <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'User Management' }} /> */}
    {/* <Stack.Screen name="SystemAnalytics" component={SystemAnalyticsScreen} options={{ title: 'System Analytics' }} /> */}
    {/* <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} options={{ title: 'System Settings' }} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
