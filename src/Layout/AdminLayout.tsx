import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { getToken } from "../services/localStorageService";

export const AdminLayout = () => {
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
        <div className="container flex w-screen mt-12">
            <nav className=" h-screen flex flex-col w-[25%]">
                <div className="mt-4">
                    <Link to="/admin/users">
                        <button className="hover:font-bold p-3 flex font-semibold text-gray-800  hover:opacity-100 transition-opacity duration-300 bg-transparent hover:bg-blue-200 rounded-lg">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                className="size-6 mr-2"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                />
                            </svg>
                            QUẢN LÝ TÀI KHOẢN
                        </button>
                    </Link>
                </div>
                <div className="mt-4">
                    <Link to="/admin/product">
                        <button className=" hover:font-bold  p-3 flex font-semibold text-gray-800  hover:opacity-100 transition-opacity duration-300 bg-transparent hover:bg-blue-200 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6 mr-2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            QUẢN LÝ SẢN PHẨM
                        </button>
                    </Link>
                </div>
                <div className="mt-4">
                    <Link to="/admin/category">
                        <button className="hover:font-bold  p-3 flex font-semibold text-gray-800  hover:opacity-100 transition-opacity duration-300 bg-transparent hover:bg-blue-200 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6 mr-2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                            </svg>

                            QUẢN LÝ DANH MỤC
                        </button>
                    </Link>
                </div>
                <div className="mt-4">
                    <Link to="/admin/brand">
                        <button className="hover:font-bold  p-3 flex font-semibold text-gray-800  hover:opacity-100 transition-opacity duration-300 bg-transparent hover:bg-blue-200 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6 mr-2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                            </svg>


                            QUẢN LÝ THƯƠNG HIỆU
                        </button>
                    </Link>
                </div>
                <div className="mt-4">
                    <Link to="/admin/order">
                        <button className="hover:font-bold  p-3 flex font-semibold text-gray-800  hover:opacity-100 transition-opacity duration-300 bg-transparent hover:bg-blue-200 rounded-lg">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                className="size-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                                />
                            </svg>
                            Quản lý đơn hàng
                        </button>
                    </Link>
                </div>
                <div className="mt-4">
                    <Link to="/admin/news">
                        <button className="hover:font-bold  p-3 flex font-semibold text-gray-800  hover:opacity-100 transition-opacity duration-300 bg-transparent hover:bg-blue-200 rounded-lg">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                className="size-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                                />
                            </svg>
                            Quản lý bài viết
                        </button>
                    </Link>
                </div>

            </nav>
            <div className="w-full">
                <Outlet />
            </div>
        </div>
    );
};