import axios from "axios";

const API_URL = "http://localhost:8080/datn";
export const fetchUserInfo = (token: string) =>
    axios.get(`${API_URL}/users/myInfo`, {
        headers: { Authorization: `Bearer ${token}` },
    });

export const placeOrder = (data: any, token: string) =>
    axios.post(`${API_URL}/orders/place`, data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });