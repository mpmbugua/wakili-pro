import { Request, Response } from 'express';
import { UserAdminService } from '../../../services/admin/users/userAdminService';

export const listUsers = (req: Request, res: Response) => {
  res.json(UserAdminService.list());
};

export const updateUser = (req: Request, res: Response) => {
  const user = UserAdminService.update(req.params.id, req.body);
  res.json(user);
};

export const changeUserRole = (req: Request, res: Response) => {
  const user = UserAdminService.changeRole(req.params.id, req.body.role);
  res.json(user);
};

export const deactivateUser = (req: Request, res: Response) => {
  UserAdminService.deactivate(req.params.id);
  res.json({ success: true });
};
