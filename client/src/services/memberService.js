import api from "./axios";

export const searchMember = (phone) =>
  api.get(`/members?phone=${phone}`);

export const createMember = (data) =>
  api.post("/members", data);

export const getPointsHistory = (id) =>
  api.get(`/members/${id}/points-history`);
