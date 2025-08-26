import axios from "axios";

const API_URL = "http://localhost:8000";

export interface PendingShare {
    share_id: number;
    material_name: string;
    sharer_email: string;
}

export const fetchPendingSharesApi = async () => {
    const response = await axios.get<PendingShare[]>(
        `${API_URL}/shares/pending`,
    );
    return response.data;
};

export const acceptShareApi = async (share_id: number) => {
    const response = await axios.post(
        `${API_URL}/shares/pending/${share_id}/accept`,
    );
    return response.data;
};

export const rejectShareApi = async (share_id: number) => {
    const response = await axios.delete(
        `${API_URL}/shares/pending/${share_id}`,
    );
    return response.data;
};
