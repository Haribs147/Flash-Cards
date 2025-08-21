import axios from "axios";

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
