import axios from "axios";

export interface EnvProject {
  _id: string;
  projectName: string;
  envContent: string;
  createdAt: string;
}

export interface PostEnvPayload {
  projectName: string;
  envContent: string;
}

export interface UpdateEnvPayload {
  projectName: string;
  envContent: string;
}

export const postEnv = async (payload: PostEnvPayload): Promise<{ message: string; id: string }> => {
  const res = await axios.post("/api/post", payload);
  return res.data;
};

export const getAllEnv = async (): Promise<EnvProject[]> => {
  const res = await axios.get("/api/get");
  return res.data;
};

export const deleteAEnv = async (id: string): Promise<{ message: string }> => {
  const res = await axios.delete(`/api/delete/${id}`);
  return res.data;
};

export const updateAEnv = async (id: string, payload: UpdateEnvPayload): Promise<{ message: string }> => {
  const res = await axios.put(`/api/update/${id}`, payload);
  return res.data;
};