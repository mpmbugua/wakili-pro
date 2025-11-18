import React, { useState } from 'react';
import { usePrices } from '@/hooks/admin/usePrices';
import { Price } from '@shared/types/admin/Price';
import { AdminAppSettings } from './AdminAppSettings';

const emptyPrice: Omit<Price, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'subscription',
  name: '',
  amount: 0,
  currency: 'USD',
  active: true,
};

export const PriceManager: React.FC = () => {
  const { prices, isLoading, createPrice, updatePrice, deletePrice } = usePrices();
  const [form, setForm] = useState(emptyPrice);
  const [editId, setEditId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updatePrice({ id: editId, ...form });
      setEditId(null);
    } else {
      createPrice({ ...form, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    setForm(emptyPrice);
  };

  const handleEdit = (p: Price) => {
    setEditId(p.id);
    setForm({ ...p });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <AdminAppSettings />
      <h2 className="text-xl font-bold mb-4">Manage Prices</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
        <select name="type" value={form.type} onChange={handleChange} className="col-span-2 border p-2 rounded">
          <option value="subscription">Subscription</option>
          <option value="document">Document</option>
        </select>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
        <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Amount" className="border p-2 rounded" required min={0} />
        <input name="currency" value={form.currency} onChange={handleChange} placeholder="Currency (e.g. USD)" className="border p-2 rounded" required maxLength={3} />
        <label className="flex items-center col-span-2">
          <input type="checkbox" name="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="mr-2" />
          Active
        </label>
        <button type="submit" className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          {editId ? 'Update Price' : 'Add Price'}
        </button>
      </form>
      {isLoading ? <div>Loading...</div> : (
        <table className="w-full text-left border-t">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prices.map(p => (
              <tr key={p.id} className="border-b">
                <td>{p.type}</td>
                <td>{p.name}</td>
                <td>{p.amount}</td>
                <td>{p.currency}</td>
                <td>{p.active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button className="text-blue-600 mr-2" onClick={() => handleEdit(p)}>Edit</button>
                  <button className="text-red-600" onClick={() => deletePrice(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
