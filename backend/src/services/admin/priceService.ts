
// Inline type for price objects (customize as needed)
interface Price {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  updatedAt?: string;
}

let prices: Price[] = [];

export const PriceService = {
  getAll: () => prices,
  create: (data: Price) => {
    prices.push(data);
    return data;
  },
  update: (id: string, data: Partial<Price>) => {
    const idx = prices.findIndex(p => p.id === id);
    if (idx !== -1) {
      prices[idx] = { ...prices[idx], ...data, updatedAt: new Date().toISOString() };
      return prices[idx];
    }
    return null;
  },
  delete: (id: string) => {
    const idx = prices.findIndex(p => p.id === id);
    if (idx !== -1) prices.splice(idx, 1);
  },
};
