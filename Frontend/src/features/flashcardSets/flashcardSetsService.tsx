import axios from "axios";
import type { FlashcardSetsState } from "./flashcardSetsSlice";

const API_URL = "http://localhost:8000";

export const createNewSetApi = async (setData: {
    name: string;
    parent_id: number | null;
}) => {
    const response = await axios.post(`${API_URL}/sets`, setData);
    return response.data;
};

export const updateSetApi = async (
    set_id: number,
    updateSetData: Omit<FlashcardSetsState, "status" | "error" | "id">,
) => {
    const response = await axios.patch(
        `${API_URL}/sets/${set_id}`,
        updateSetData,
    );
    return response.data;
};
