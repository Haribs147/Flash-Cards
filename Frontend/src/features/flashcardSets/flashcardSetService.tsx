import axios from "axios";
import type { SharedUser } from "./flashcardSetSlice";

const API_URL = "http://localhost:8000";

interface FlashcardPayload {
    id: number | null;
    front_content: string;
    back_content: string;
}

interface FlashcardSetPayload {
    name: string;
    description: string;
    is_public: boolean;
    parent_id: number | null;
    flashcards: FlashcardPayload[];
}

export const createNewSetApi = async (setData: FlashcardSetPayload) => {
    const response = await axios.post(`${API_URL}/sets`, setData);
    return response.data;
};

export const updateSetApi = async (
    set_id: number,
    updateSetData: Omit<FlashcardSetPayload, "parent_id">,
) => {
    const response = await axios.patch(
        `${API_URL}/sets/${set_id}`,
        updateSetData,
    );
    return response.data;
};

export const getSetApi = async (set_id: number) => {
    const response = await axios.get(`${API_URL}/sets/${set_id}`);
    return response.data;
};

export const shareSetApi = async (
    setId: number,
    email: string,
): Promise<SharedUser> => {
    const response = await axios.post(`${API_URL}/materials/${setId}/share`, {
        email,
        permission: "viewer",
    });
    return response.data;
};

export const removeShareApi = async (setId: number, userId: number) => {
    await axios.delete(`${API_URL}/materials/${setId}/share/${userId}`);
};

export const updateSharesApi = async (
    setId: number,
    updates: { user_id: number; permission: string }[],
) => {
    await axios.post(`${API_URL}/materials/${setId}/shares/update`, {
        updates,
    });
};

export const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();

    formData.append("file", file);

    try {
        const response = await axios.post(`${API_URL}/upload-image`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
        });

        if (response.data && response.data.url) {
            return response.data.url;
        } else {
            throw new Error("Upload image to server does not work");
        }
    } catch (error) {
        console.error("error uploading an image: ", error);
        throw new Error("Upload image to server does not work");
    }
};

export const voteOnMaterialApi = async (
    materialId: number,
    vote_type: "upvote" | "downvote",
) => {
    const response = await axios.post(
        `${API_URL}/materials/${materialId}/vote`,
        { vote_type },
    );
    return response.data;
};

export const addCommentApi = async (
    materialId: number,
    text: string,
    parent_comment_id?: number | null,
) => {
    const response = await axios.post(
        `${API_URL}/materials/${materialId}/comments`,
        { text, parent_comment_id },
    );
    return response.data;
};

export const deleteCommentApi = async (commentId: number) => {
    await axios.delete(`${API_URL}/comments/${commentId}`);
    return commentId;
};

export const updateCommentApi = async (commentId: number, text: string) => {
    const response = await axios.patch(`${API_URL}/comments/${commentId}`, {
        text,
    });
    return response.data;
};

export const voteOnCommentApi = async (
    commentId: number,
    vote_type: "upvote" | "downvote",
) => {
    const response = await axios.post(`${API_URL}/comments/${commentId}/vote`, {
        vote_type,
    });
    return response.data;
};
