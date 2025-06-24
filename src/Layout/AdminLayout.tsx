import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { getToken, removeToken } from "../services/localStorageService";

export const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

            if (!response.ok) {
                throw new Error("Không thể lấy thông tin người dùng");
            }

            const data = await response.json();
            if (data.result?.roles?.some((role: { name: string }) => role.name === 'ADMIN')) {
                setIsAdmin(true);
            } else {
                throw new Error("Không có quyền admin");
            }
        } catch (error) {
            console.error("Lỗi khi kiểm tra quyền admin:", error);
            setIsAdmin(false);
        } finally {
            setIsLoading(false);
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

    const handleLogout = () => {
        removeToken();
        navigate("/login");
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Breadcrumb logic
    const getBreadcrumbs = () => {
        const pathnames = location.pathname.split("/").filter((x) => x);
        const crumbs = [{ name: "Admin", path: "/admin" }];
        if (pathnames.length > 1) {
            crumbs.push({
                name: pathnames[1].replace(/^\w/, (c) => c.toUpperCase()),
                path: location.pathname,
            });
        }
        return crumbs;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#EDF2F7]">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-[#2C5282]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="mt-2 text-[#1A202C]">Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#EDF2F7]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[#2C5282] text-white shadow-md z-10 flex items-center justify-between px-4">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="text-white hover:text-[#3182CE] mr-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center text-white hover:text-[#E53E3E] transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-6 h-6 mr-2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                        />
                    </svg>
                    Đăng xuất
                </button>
            </header>



            {/* Sidebar */}
            <nav className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-[#2C5282] text-white shadow-xl transition-all duration-300 ${isSidebarOpen ? 'w-[260px]' : 'w-16'}`}>
                <div className="flex flex-col p-2 space-y-2">
                    {[
                        { to: "/admin/dashboard", label: "TỔNG QUAN", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" },
                        { to: "/admin/users", label: "QUẢN LÝ TÀI KHOẢN", icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
                        { to: "/admin/product", label: "QUẢN LÝ SẢN PHẨM", icon: "M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" },
                        { to: "/admin/category", label: "QUẢN LÝ DANH MỤC", icon: "M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z M6 6h.008v.008H6V6Z" },
                        { to: "/admin/brand", label: "QUẢN LÝ THƯƠNG HIỆU", icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" },
                        { to: "/admin/order", label: "QUẢN LÝ ĐƠN HÀNG", icon: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" },
                        { to: "/admin/stockin", label: "QUẢN LÝ NHẬP KHO", icon: "m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" },
                        { to: "/admin/discount", label: "QUẢN LÝ GIẢM GIÁ", icon: "M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" },


                    ].map((item) => (
                        <Link to={item.to} key={item.to}>
                            <button
                                className={`w-full p-3 flex items-center text-white font-semibold rounded-lg transition-all duration-300 relative group ${location.pathname === item.to
                                    ? "bg-[#3182CE] text-white"
                                    : "hover:bg-[#3182CE] hover:font-bold"
                                    }`}
                                title={isSidebarOpen ? "" : item.label}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-6 h-6 flex-shrink-0"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                </svg>
                                {isSidebarOpen && <span className="ml-2">{item.label}</span>}
                            </button>
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Main content */}
            <div className={`flex-1 mt-16 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'} bg-[#EDF2F7]`}>
                {/* Breadcrumb */}
                <div className="p-4 border-b border-gray-200 bg-white">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="flex space-x-2 text-sm text-[#1A202C]">
                            {getBreadcrumbs().map((crumb, index) => (
                                <li key={crumb.path} className="flex items-center">
                                    {index < getBreadcrumbs().length - 1 ? (
                                        <>
                                            <Link to={crumb.path} className="hover:text-[#3182CE]">
                                                {crumb.name}
                                            </Link>
                                            <svg
                                                className="w-4 h-4 mx-2 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </>
                                    ) : (
                                        <span className="font-semibold">{crumb.name}</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>
                <div className="p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};