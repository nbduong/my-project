import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../services/localStorageService";

export const ManageNews = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    const checkAdmin = async (accessToken: string) => {
        try {
            const response = await fetch(
                "http://localhost:8080/datn/users/myInfo",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const data = await response.json();
            if (data.result.roles && data.result.roles.some((role: { name: string }) => role.name === 'ADMIN')) {
                setIsAdmin(true);
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
        } finally {
            setIsLoading(false); // Set loading to false after fetch completes
        }
    };

    useEffect(() => {
        const accessToken = getToken();
        if (!accessToken) {
            navigate("/login");
        } else {
            checkAdmin(accessToken);
        }
    }, [navigate]);

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            navigate("/");
        }
    }, [isLoading, isAdmin, navigate]);

    if (isLoading) {
        return <div>Loading...</div>; // Show loading state while fetching
    }

    return (
        <div className="flex justify-center w-screen">
            <h6>manage-news</h6>
        </div>
    );
};