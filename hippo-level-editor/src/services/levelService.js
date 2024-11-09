import axios from 'axios';

const BASE_URL = '/api/levels';

export const getLevels = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

export const getLevel = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const createLevel = async (levelData) => {
  const response = await axios.post(BASE_URL, levelData);
  return response.data;
};

export const updateLevel = async (id, levelData) => {
  const response = await axios.put(`${BASE_URL}/${id}`, levelData);
  return response.data;
};

export const deleteLevel = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
}; 