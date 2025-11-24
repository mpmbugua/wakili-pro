import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, Server, Shield, Activity, AlertTriangle, CheckCircle,
  HardDrive, Cpu, MemoryStick, Users, Settings, Terminal,
  FileText, Lock, Key, RefreshCw, Download, Upload, Trash2,
  Eye, EyeOff, BarChart3, TrendingUp, Clock, Zap, Plus
} from 'lucide-react';
import { Button } from '../ui/Button';
import { PageHeader, StatCard, DataTable, Column } from '../ui';
import type { AuthUser } from '@wakili-pro/shared/src/types/auth';

interface SuperAdminDashboardProps {
  user: AuthUser;
}

interface SystemMetric {
  id: string;
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

interface DatabaseStat {
  name: string;
  records: number;
  size: string;
  lastBackup: string;
}

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  source: string;
}

interface AdminAction {
  id: string;
  admin: string;
  action: string;
  target: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  
  const [stats] = useState({
    serverUptime: '99.98%',
    apiResponseTime: '124ms',
    databaseSize: '2.4GB',
    activeConnections: 342,
    totalUsers: 1247,
    totalLawyers: 156,
    totalAdmins: 8,
    systemErrors: 2,
    queuedJobs: 15,
    cacheHitRate: '94.2%',
  });

  const systemMetrics: SystemMetric[] = [
    {
      id: '1',
      name: 'API Server',
      value: 'Running',
      status: 'healthy',
      lastUpdated: '2 min ago'
    },
    {
      id: '2',
      name: 'Database',
      value: 'Connected',
      status: 'healthy',
      lastUpdated: '1 min ago'
    },
    {
      id: '3',
      name: 'Redis Cache',
      value: 'Active',
      status: 'healthy',
      lastUpdated: '3 min ago'
    },
    {
      id: '4',
      name: 'File Storage',
      value: '78% Used',
      status: 'warning',
      lastUpdated: '5 min ago'
    },
    {
      id: '5',
      name: 'Email Service',
      value: 'Operational',
      status: 'healthy',
      lastUpdated: '1 min ago'
    },
    {
      id: '6',
      name: 'Payment Gateway',
      value: 'Connected',
      status: 'healthy',
      lastUpdated: '4 min ago'
    },
  ];

  const databaseStats: DatabaseStat[] = [
    { name: 'Users', records: 1247, size: '450 MB', lastBackup: '2 hours ago' },
    { name: 'Lawyers', records: 156, size: '120 MB', lastBackup: '2 hours ago' },
    { name: 'Consultations', records: 3842, size: '890 MB', lastBackup: '2 hours ago' },
    { name: 'Documents', records: 7523, size: '1.2 GB', lastBackup: '2 hours ago' },
    { name: 'Messages', records: 15680, size: '340 MB', lastBackup: '2 hours ago' },
    { name: 'Transactions', records: 2156, size: '280 MB', lastBackup: '2 hours ago' },
  ];

  const recentLogs: SystemLog[] = [
    {
      id: '1',
      level: 'error',
      message: 'Database connection timeout in transaction processor',
      timestamp: '2025-11-24 14:32:15',
      source: 'payment-service'
    },
    {
      id: '2',
      level: 'warning',
      message: 'High memory usage detected: 87% of available RAM',
      timestamp: '2025-11-24 14:28:42',
      source: 'system-monitor'
    },
    {
      id: '3',
      level: 'info',
      message: 'Scheduled backup completed successfully',
      timestamp: '2025-11-24 14:00:00',
      source: 'backup-service'
    },
    {
      id: '4',
      level: 'critical',
      message: 'SSL certificate expires in 7 days',
      timestamp: '2025-11-24 13:45:00',
      source: 'security-check'
    },
  ];

  const auditLog: AdminAction[] = [
    {
      id: '1',
      admin: 'Super Admin',
      action: 'User Role Update',
      target: 'john.kamau@email.com',
      timestamp: '2025-11-24 13:15:00',
      status: 'success'
    },
    {
      id: '2',
      admin: 'Admin Sarah',
      action: 'Lawyer Verification',
      target: 'Advocate David Otieno',
      timestamp: '2025-11-24 12:45:00',
      status: 'success'
    },
    {
      id: '3',
      admin: 'Super Admin',
      action: 'Database Backup',
      target: 'Full System Backup',
      timestamp: '2025-11-24 12:00:00',
      status: 'success'
    },
  ];

  const systemMetricColumns: Column<SystemMetric>[] = [
    { key: 'name', label: 'Service', sortable: true },
    { key: 'value', label: 'Status', sortable: true },
    {
      key: 'status',
      label: 'Health',
      render: (item) => {
        const colors = {
          healthy: 'bg-green-100 text-green-700',
          warning: 'bg-amber-100 text-amber-700',
          critical: 'bg-red-100 text-red-700',
        };
        const icons = {
          healthy: CheckCircle,
          warning: AlertTriangle,
          critical: AlertTriangle,
        };
        const Icon = icons[item.status];
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[item.status]}`}>
            <Icon className="h-3 w-3" />
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        );
      },
    },
    { key: 'lastUpdated', label: 'Last Updated' },
  ];

  const databaseColumns: Column<DatabaseStat>[] = [
    { key: 'name', label: 'Table', sortable: true },
    {
      key: 'records',
      label: 'Records',
      render: (item) => (
        <span className="font-medium text-gray-900">
          {item.records.toLocaleString()}
        </span>
      ),
    },
    { key: 'size', label: 'Size' },
    { key: 'lastBackup', label: 'Last Backup' },
  ];

  const logColumns: Column<SystemLog>[] = [
    {
      key: 'level',
      label: 'Level',
      render: (item) => {
        const colors = {
          info: 'bg-blue-100 text-blue-700',
          warning: 'bg-amber-100 text-amber-700',
          error: 'bg-red-100 text-red-700',
          critical: 'bg-red-600 text-white',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[item.level]}`}>
            {item.level.toUpperCase()}
          </span>
        );
      },
    },
    { key: 'message', label: 'Message' },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'timestamp', label: 'Timestamp', sortable: true },
  ];

  const auditColumns: Column<AdminAction>[] = [
    { key: 'admin', label: 'Admin', sortable: true },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'target', label: 'Target' },
    { key: 'timestamp', label: 'Timestamp', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const colors = {
          success: 'bg-green-100 text-green-700',
          failed: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[item.status]}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Super Admin Dashboard"
        subtitle={`Welcome, ${user.firstName}!`}
        description="Full system control, database management, and platform configuration"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/super-admin/logs')}>
              <FileText className="h-4 w-4 mr-2" />
              View All Logs
            </Button>
            <Button variant="outline" onClick={() => navigate('/super-admin/backup')}>
              <Download className="h-4 w-4 mr-2" />
              Backup System
            </Button>
            <Button variant="primary" onClick={() => navigate('/super-admin/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </>
        }
      />

      {/* System Health Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Server Uptime"
          value={stats.serverUptime}
          change="Last 30 days"
          trend="up"
          icon={Server}
          iconColor="text-green-600"
          description="System availability"
          className="hover:shadow-lg transition-all duration-200"
        />
        <StatCard
          title="API Response"
          value={stats.apiResponseTime}
          change="Average"
          trend="neutral"
          icon={Zap}
          iconColor="text-blue-600"
          description="Performance"
          className="hover:shadow-lg transition-all duration-200"
        />
        <StatCard
          title="Database Size"
          value={stats.databaseSize}
          change={`${stats.activeConnections} active connections`}
          trend="neutral"
          icon={Database}
          iconColor="text-purple-600"
          description="Storage used"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/super-admin/database')}
        />
        <StatCard
          title="System Errors"
          value={stats.systemErrors}
          change="Last 24 hours"
          trend={stats.systemErrors > 0 ? 'down' : 'neutral'}
          icon={AlertTriangle}
          iconColor="text-red-600"
          description="Requires attention"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/super-admin/logs?level=error')}
        />
      </div>

      {/* Critical System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Platform Users</h3>
            <Users className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-green-100 text-sm">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-400/30">
              <div>
                <p className="text-green-100 text-xs">Lawyers</p>
                <p className="text-lg font-semibold">{stats.totalLawyers}</p>
              </div>
              <div>
                <p className="text-green-100 text-xs">Admins</p>
                <p className="text-lg font-semibold">{stats.totalAdmins}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">System Performance</h3>
            <Activity className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-blue-100 text-sm">Cache Hit Rate</p>
              <p className="text-2xl font-bold">{stats.cacheHitRate}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-400/30">
              <div>
                <p className="text-blue-100 text-xs">Queue Jobs</p>
                <p className="text-lg font-semibold">{stats.queuedJobs}</p>
              </div>
              <div>
                <p className="text-blue-100 text-xs">Connections</p>
                <p className="text-lg font-semibold">{stats.activeConnections}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => navigate('/super-admin/maintenance')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Maintenance Mode
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => navigate('/super-admin/cache')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => navigate('/super-admin/backup')}
            >
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          </div>
        </div>
      </div>

      {/* System Services Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Services</h3>
            <p className="text-sm text-gray-600 mt-1">Real-time status of all platform services</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin/services')}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
        <DataTable
          data={systemMetrics}
          columns={systemMetricColumns}
          onRowClick={(metric) => navigate(`/super-admin/services/${metric.id}`)}
        />
      </div>

      {/* Database Statistics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Database Statistics</h3>
            <p className="text-sm text-gray-600 mt-1">Table sizes, record counts, and backup status</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/super-admin/database/optimize')}>
              <Zap className="h-4 w-4 mr-1" />
              Optimize
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/super-admin/database/backup')}>
              <Download className="h-4 w-4 mr-1" />
              Backup Now
            </Button>
          </div>
        </div>
        <DataTable
          data={databaseStats}
          columns={databaseColumns}
          onRowClick={(table) => navigate(`/super-admin/database/${table.name.toLowerCase()}`)}
        />
      </div>

      {/* System Logs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent System Logs</h3>
            <p className="text-sm text-gray-600 mt-1">Latest system events and error tracking</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin/logs')}>
            View all logs
          </Button>
        </div>
        <DataTable
          data={recentLogs}
          columns={logColumns}
          onRowClick={(log) => navigate(`/super-admin/logs/${log.id}`)}
        />
      </div>

      {/* Admin Audit Log */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Admin Audit Log</h3>
            <p className="text-sm text-gray-600 mt-1">Track all administrative actions and changes</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin/audit')}>
            View full audit
          </Button>
        </div>
        <DataTable
          data={auditLog}
          columns={auditColumns}
          onRowClick={(action) => navigate(`/super-admin/audit/${action.id}`)}
        />
      </div>

      {/* System Administration Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Administration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start" onClick={() => navigate('/super-admin/users')}>
            <Users className="h-4 w-4 mr-2" />
            Manage All Users
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/super-admin/database')}>
            <Database className="h-4 w-4 mr-2" />
            Database Console
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/super-admin/config')}>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/super-admin/security')}>
            <Shield className="h-4 w-4 mr-2" />
            Security Settings
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/super-admin/api-keys')}>
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/super-admin/logs')}>
            <Terminal className="h-4 w-4 mr-2" />
            System Logs
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/super-admin/backup')}>
            <Download className="h-4 w-4 mr-2" />
            Backup & Restore
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/super-admin/monitoring')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            System Monitoring
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
        </div>
        <p className="text-sm text-red-700 mb-4">
          These actions are irreversible and can have significant impact on the platform. Use with extreme caution.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="justify-start border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => navigate('/super-admin/maintenance?mode=enable')}
          >
            <Lock className="h-4 w-4 mr-2" />
            Enable Maintenance
          </Button>
          <Button 
            variant="outline" 
            className="justify-start border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => navigate('/super-admin/cache/clear-all')}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Cache
          </Button>
          <Button 
            variant="outline" 
            className="justify-start border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => navigate('/super-admin/database/reset')}
          >
            <Database className="h-4 w-4 mr-2" />
            Reset Database
          </Button>
          <Button 
            variant="outline" 
            className="justify-start border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => navigate('/super-admin/system/reboot')}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reboot System
          </Button>
        </div>
      </div>
    </div>
  );
};
