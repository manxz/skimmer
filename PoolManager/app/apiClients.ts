import axios from 'axios';
import { API_BASE_URL } from '../constants/Api';

export async function fetchClients() {
  const res = await axios.get(`${API_BASE_URL}/clients`);
  return res.data;
}

export type ClientInput = {
  name: string;
  address: string;
  phone: string;
  email: string;
  serviceDay?: string;
  servicePerson?: string;
};

export async function addClient(client: ClientInput) {
  try {
    const res = await axios.post(`${API_BASE_URL}/clients`, client);
    return res.data;
  } catch (error: any) {
    console.error('Add client error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to add client');
  }
}

export async function updateClient(id: string, client: ClientInput) {
  try {
    const res = await axios.put(`${API_BASE_URL}/clients/${id}`, client);
    return res.data;
  } catch (error: any) {
    console.error('Update client error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to update client');
  }
}

export async function deleteClient(id: string) {
  const res = await axios.delete(`${API_BASE_URL}/clients/${id}`);
  return res.data;
} 