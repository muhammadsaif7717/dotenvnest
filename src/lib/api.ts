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

export interface SharedUser {
  email: string;
  role: "viewer" | "editor";
}

export interface EnvProject {
  _id: string;
  projectName: string;
  envContent: string;
  tags?: string[];
  createdAt: string;
  lastModified?: string;
  sharedWith?: SharedUser[];
  ownerEmail?: string;
  isShared?: boolean;
  userRole?: "viewer" | "editor";
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

export const getAllEnv = async (page = 1, limit = 10, search = "", type = "all"): Promise<PaginatedEnvResponse> => {
  const url = `/api/get?page=${page}&limit=${limit}&type=${type}${
    search ? `&search=${encodeURIComponent(search)}` : ""
  }`;
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

export const shareEnv = async (id: string, sharedWith: SharedUser[]): Promise<{ message: string }> => {
  const res = await axios.post(`/api/share/${id}`, { sharedWith });
  return res.data;
};

export const leaveSharedEnv = async (id: string): Promise<{ message: string }> => {
  const res = await axios.post(`/api/share/leave/${id}`);
  return res.data;
};