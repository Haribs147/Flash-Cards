import axios from "axios";

export type PublicSet = {
    id: number;
    name: string;
    description: string;
    creator: string;
    created_at: string;
};

export type MostLikedSet = PublicSet & {
    like_count: number;
};

export type MostViewedSet = PublicSet & {
    view_count: number;
};

export type MostRecentSets = PublicSet;

export type TimePeriod = "day" | "week" | "month" | "year";

const API_URL = "http://localhost:8000";

export const fetchMostViewedSets = async (period: TimePeriod) => {
    const response = await axios.get(
        `${API_URL}/public/sets/most_viewed?period=${period}`,
    );
    return response.data;
};

export const fetchMostLikedSets = async (period: TimePeriod) => {
    const response = await axios.get(
        `${API_URL}/public/sets/most_liked?period=${period}`,
    );
    return response.data;
};

export const fetchRecentlyCreatedSets = async () => {
    const response = await axios.get(`${API_URL}/public/sets/recently_created`);
    return response.data;
};
