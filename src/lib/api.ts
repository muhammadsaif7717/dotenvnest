import axios from "axios";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export interface EnvProject {
  _id: string;
  projectName: string;
  envContent: string;
  tags?: string[];
  createdAt: string;
  lastModified?: string;
}

export interface PostEnvPayload {
  projectName: string;
  envContent: string;
  tags?: string[];
}

export interface UpdateEnvPayload {
  projectName: string;
  envContent: string;
  tags?: string[];
}

export const postEnv = async (payload: PostEnvPayload): Promise<{ message: string; id: string }> => {
  const res = await axios.post("/api/post", payload);
  return res.data;
};

export interface PaginatedEnvResponse {
  data: EnvProject[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export const getAllEnv = async (page = 1, limit = 10, search = ""): Promise<PaginatedEnvResponse> => {
  const url = search 
    ? `/api/get?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}` 
    : `/api/get?page=${page}&limit=${limit}`;
  const res = await axios.get(url);
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