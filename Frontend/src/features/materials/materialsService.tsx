import axios from "axios";
import { type MaterialItem } from "./materialsSlice";

const API_URL = "http://localhost:8000";

export const fetchAllMaterialsApi = async () => {
    const response = await axios.get<MaterialItem[]>(
        `${API_URL}/materials/all`,
    );
    return response.data;
};

export const createNewFolderApi = async (folderData: {
    name: string;
    parent_id: number | null;
}) => {
    const response = await axios.post<MaterialItem>(
        `${API_URL}/folders`,
        folderData,
    );
    return response.data;
};

export const moveItemApi = async (data: {
    itemId: number;
    targetFolderId: number | null;
}) => {
    const { itemId, targetFolderId } = data;
    const response = await axios.patch<MaterialItem>(
        `${API_URL}/materials/${itemId}`,
        { parent_id: targetFolderId },
    );
    return response.data;
};

export const renameItemApi = async (data: {
    itemId: number;
    newName: string;
}) => {
    const { itemId, newName } = data;
    const response = await axios.patch(`${API_URL}/materials/${itemId}`, {
        name: newName,
    });
    return response.data;
};

export const deleteItemApi = async (itemId: number) => {
    const response = await axios.delete<number[]>(
        `${API_URL}/materials/${itemId}`,
    );
    return response.data;
};

export const getRecentSetsApi = async () => {
    const response = await axios.get(`${API_URL}/recent-sets`);
    return response.data;
};
