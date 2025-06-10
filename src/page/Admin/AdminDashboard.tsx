import { useEffect, useState } from "react";
import { getToken } from "../../services/localStorageService";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    phone: string;
    address: string;
    gender: string;
    dob: string | null;
    roles: { name: string; description: string; permissions: { name: string; description: string }[] }[];
    status: string;
    createdBy: string | null;
    createdDate: string | null;
    lastModifiedBy: string;
    lastModifiedDate: string;
    isDeleted: boolean | null;
}

interface Order {
    id: string;
    totalAmount: number;
    createdDate: string; // ISO date string, e.g., "2025-06-01T12:00:00Z"
}

interface ApiResponse<T> {
    code: number;
    result: T;
}

interface DashboardStats {
    totalUsers: number;
    totalOrders: number;
}

interface MonthlyRevenue {
    month: string;
    revenue: number;
}

export const AdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch dashboard data from user and order APIs
    const fetchDashboardData = async (accessToken: string) => {
        try {
            // Fetch users
            const usersResponse = await fetch("http://localhost:8080/datn/users", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!usersResponse.ok) {
                throw new Error("Không thể lấy dữ liệu người dùng");
            }
            const usersData: ApiResponse<User[]> = await usersResponse.json();
            if (usersData.code !== 0) {
                throw new Error("Lỗi từ API người dùng");
            }

            // Fetch orders
            const ordersResponse = await fetch("http://localhost:8080/datn/orders", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!ordersResponse.ok) {
                throw new Error("Không thể lấy dữ liệu đơn hàng");
            }
            const ordersData: ApiResponse<Order[]> = await ordersResponse.json();
            if (ordersData.code !== 0) {
                throw new Error("Lỗi từ API đơn hàng");
            }

            // Calculate stats
            const totalUsers = usersData.result.length;
            const totalOrders = ordersData.result.length;

            // Calculate monthly revenue
            const revenueByMonth: { [key: string]: number } = {};
            ordersData.result.forEach((order) => {
                const date = new Date(order.createdDate);
                const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
                revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + order.totalAmount;
            });

            const monthlyRevenueData: MonthlyRevenue[] = Object.entries(revenueByMonth)
                .map(([month, revenue]) => ({ month, revenue }))
                .sort((a, b) => a.month.localeCompare(b.month))
                .slice(-6); // Show last 6 months

            setStats({ totalUsers, totalOrders });
            setMonthlyRevenue(monthlyRevenueData);
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const accessToken = getToken();
        if (accessToken) {
            fetchDashboardData(accessToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    // Chart data for monthly revenue
    const chartData = {
        labels: monthlyRevenue.map((item) => item.month),
        datasets: [
            {
                label: "Doanh thu (VND)",
                data: monthlyRevenue.map((item) => item.revenue),
                borderColor: "#2C5282",
                backgroundColor: "rgba(44, 82, 130, 0.2)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Doanh thu theo tháng",
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Doanh thu (VND)",
                },
            },
        },
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <svg
                    className="animate-spin h-8 w-8 text-[#2C5282]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                <span className="ml-2 text-[#1A202C]">Đang tải...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <h2 className="text-2xl font-bold text-[#1A202C]">Tổng quan</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        title: "Tổng người dùng",
                        value: stats?.totalUsers || 0,
                        icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
                    },
                    {
                        title: "Tổng đơn hàng",
                        value: stats?.totalOrders || 0,
                        icon: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z",
                    },
                ].map((stat) => (
                    <div
                        key={stat.title}
                        className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-10 h-10 text-[#2C5282]"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                        </svg>
                        <div>
                            <h3 className="text-sm font-semibold text-[#1A202C]">
                                {stat.title}
                            </h3>
                            <p className="text-2xl font-bold text-[#2C5282]">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#1A202C] mb-4">
                    Doanh thu theo tháng
                </h3>
                <div className="h-64">
                    {monthlyRevenue.length > 0 ? (
                        <Line data={chartData} options={chartOptions} />
                    ) : (
                        <p className="text-sm text-[#718096]">
                            Không có dữ liệu doanh thu để hiển thị.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

