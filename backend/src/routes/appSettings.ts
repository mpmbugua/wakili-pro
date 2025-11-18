import { Router } from 'express';
import { getAppSetting, setAppSetting, getAllAppSettings } from '../services/appSettingService';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Get all app settings (admin only)
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const settings = await getAllAppSettings();
  res.json({ success: true, data: settings });
});

// Get a specific setting (admin only)
router.get('/:key', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const value = await getAppSetting(req.params.key);
  if (value === null) {
    res.status(404).json({ success: false, message: 'Setting not found' });
  } else {
    res.json({ success: true, data: { key: req.params.key, value } });
  }
});

// Update a setting (admin only)
router.put('/:key', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { value } = req.body;
  if (typeof value !== 'string') {
    res.status(400).json({ success: false, message: 'Value must be a string' });
    return;
  }
  await setAppSetting(req.params.key, value);
  res.json({ success: true, message: 'Setting updated', data: { key: req.params.key, value } });
});

export default router;
