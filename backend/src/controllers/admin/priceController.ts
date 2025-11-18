import { Request, Response } from 'express';
import { PriceService } from '../../services/admin/priceService';

export const getPrices = (req: Request, res: Response) => {
  res.json(PriceService.getAll());
};

export const createPrice = (req: Request, res: Response) => {
  const price = PriceService.create(req.body);
  res.status(201).json(price);
};

export const updatePrice = (req: Request, res: Response) => {
  const price = PriceService.update(req.params.id, req.body);
  res.json(price);
};

export const deletePrice = (req: Request, res: Response) => {
  PriceService.delete(req.params.id);
  res.status(204).send();
};
