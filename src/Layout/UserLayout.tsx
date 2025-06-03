import { useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { getToken } from "../services/localStorageService";

export const UserLayout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = getToken();
        if (!accessToken) {
            navigate("/login");
        }
    }, [navigate]);

    return (
        <div className="container flex w-screen mt-12">
            <nav className=" h-screen flex flex-col w-[25%]">
                <div className="mt-4">
                    <Link to="/user/profile">
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
                            Tài khoản của bạn
                        </button>
                    </Link>
                </div>
                <div className="mt-4">
                    <Link to="/user/order">
                        <button className="hover:font-bold p-3 flex font-semibold text-gray-800  hover:opacity-100 transition-opacity duration-300 bg-transparent hover:bg-blue-200 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6 mr-2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>

                            Đơn hàng của bạn
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