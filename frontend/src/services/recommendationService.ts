import { RecommendationResponse } from "../types/opportunity";

const API_BASE_URL = "http://localhost:5000/api";

export async function fetchRecommendations(
  userId: string,
  token: string
): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE_URL}/recommendations/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch recommendations");
  }

  return response.json();
}
export async function fetchAllOpportunities(
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE_URL}/opportunities?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch all opportunities");
  }

  return response.json();
}
