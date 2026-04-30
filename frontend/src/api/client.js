import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const startGame = (payload) => api.post("/game/start", payload).then((r) => r.data);
export const getState = (id) => api.get(`/game/state/${id}`).then((r) => r.data);
export const getQuestion = (id, key) =>
  api.get(`/game/question/${id}/${key}`).then((r) => r.data);
export const submitAnswer = (payload) =>
  api.post("/game/answer", payload).then((r) => r.data);
export const movePlayer = (payload) =>
  api.post("/game/move", payload).then((r) => r.data);

// ML endpoints
export const getMLHalflives = (id) =>
  api.get(`/ml/halflives/${id}`).then((r) => r.data);
export const getMLUncertainty = (id) =>
  api.get(`/ml/uncertainty/${id}`).then((r) => r.data);
export const getMLCompass = (id) =>
  api.get(`/ml/compass/${id}`).then((r) => r.data);
export const getMLProfile = (id) =>
  api.get(`/ml/profile/${id}`).then((r) => r.data);
export const getMLDecayHistory = (id) =>
  api.get(`/ml/decay-history/${id}`).then((r) => r.data);

export default api;
