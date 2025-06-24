import { useEffect, useState } from "react";
import { getToken } from "../../services/localStorageService";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

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
    id: number;
    userId: string;
    userName: string;
    orderNumber: string;
    totalAmount: number;
    totalProfit: number;
    status: string;
    shippingAddress: string;
    paymentMethod: string;
    shipmentMethod: string;
    orderNote: string;
    createdDate: string;
    createdBy: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    isDeleted: boolean;
    orderItems: OrderItem[];
}

interface OrderItem {
    id: string;
    product: {
        id: string;
        name: string;
        category: {
            id: string;
            name: string;
        };
        price: number;
    };
    quantity: number;
}

interface ApiResponse<T> {
    code: number;
    result: T | null;
}

interface DashboardStats {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
}

interface MonthlyRevenue {
    month: string;
    revenue: number;
}

interface MonthlyProfit {
    month: string;
    profit: number;
}



export const AdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
    const [monthlyProfit, setMonthlyProfit] = useState<MonthlyProfit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async (accessToken: string) => {
        try {
            setError(null);
            // Fetch users
            const usersResponse = await fetch("http://localhost:8080/datn/users", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!usersResponse.ok) throw new Error("Không thể lấy dữ liệu người dùng");
            const usersData: ApiResponse<User[]> = await usersResponse.json();
            if (usersData.code !== 0 || !Array.isArray(usersData.result)) {
                throw new Error("Dữ liệu người dùng không hợp lệ");
            }

            // Fetch orders
            const ordersResponse = await fetch("http://localhost:8080/datn/orders", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!ordersResponse.ok) throw new Error("Không thể lấy dữ liệu đơn hàng");
            const ordersData: ApiResponse<Order[]> = await ordersResponse.json();
            if (ordersData.code !== 0 || !Array.isArray(ordersData.result)) {
                throw new Error("Dữ liệu đơn hàng không hợp lệ");
            }

            // Calculate stats
            const totalUsers = usersData.result.length;
            const totalOrders = ordersData.result.length;
            const totalRevenue = ordersData.result.reduce((sum, order) => sum + order.totalAmount, 0);
            const totalProfit = ordersData.result.reduce((sum, order) => sum + order.totalProfit, 0);

            // Calculate monthly revenue and profit
            const revenueByMonth: { [key: string]: number } = {};
            const profitByMonth: { [key: string]: number } = {};
            const categoryQuantities: { [key: string]: number } = {};

            ordersData.result.forEach((order) => {
                const date = new Date(order.createdDate);
                if (isNaN(date.getTime())) return; // Skip invalid dates
                const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;

                revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + order.totalAmount;
                profitByMonth[monthYear] = (profitByMonth[monthYear] || 0) + order.totalProfit;

                order.orderItems.forEach((item) => {
                    const categoryName = item.product?.category?.name || "Không xác định";
                    categoryQuantities[categoryName] = (categoryQuantities[categoryName] || 0) + item.quantity;
                });
            });

            const monthlyRevenueData: MonthlyRevenue[] = Object.entries(revenueByMonth)
                .map(([month, revenue]) => ({ month, revenue }))
                .sort((a, b) => a.month.localeCompare(b.month))
                .slice(-6);

            const monthlyProfitData: MonthlyProfit[] = Object.entries(profitByMonth)
                .map(([month, profit]) => {
                    const parsedProfit = typeof profit === "number" ? profit : 0;
                    return { month, profit: parsedProfit };
                })
                .sort((a, b) => a.month.localeCompare(b.month))
                .slice(-6);


            setStats({ totalUsers, totalOrders, totalRevenue, totalProfit });
            setMonthlyRevenue(monthlyRevenueData);
            setMonthlyProfit(monthlyProfitData);
        } catch (error: any) {
            console.error("Lỗi khi lấy dữ liệu dashboard:", error);
            setError(error.message || "Đã xảy ra lỗi khi tải dữ liệu dashboard");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const accessToken = getToken();
        if (!accessToken) {
            setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
            setIsLoading(false);
            return;
        }
        fetchDashboardData(accessToken);
    }, []);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" as const },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const dataset = context.dataset;
                        const value = context.parsed.y;
                        return `${dataset.label}: ${value.toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        })}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: "Số tiền (VND)" },
            },
        },
    };

    const revenueChartData = {
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

    const profitChartData = {
        labels: monthlyProfit.map((item) => item.month),
        datasets: [
            {
                label: "Lợi nhuận (VND)",
                data: monthlyProfit.map((item) => item.profit),
                borderColor: "#3182CE",
                backgroundColor: "rgba(49, 130, 206, 0.2)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <svg
                    className="animate-spin h-8 w-8 text-[#2C5282]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
                <span className="ml-2 text-[#1A202C]">Đang tải...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-[#1A202C]">Tổng quan</h2>
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
                    {
                        title: "Tổng doanh thu",
                        value: stats?.totalRevenue || 0,
                        icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0Z",
                        format: "currency",
                    },
                    {
                        title: "Tổng lợi nhuận",
                        value: stats?.totalProfit || 0,
                        icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0Z",
                        format: "currency",
                    },
                ].map((stat) => (
                    <div key={stat.title} className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
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
                            <h3 className="text-sm font-semibold text-[#1A202C]">{stat.title}</h3>
                            <p className="text-2xl font-bold text-[#2C5282]">
                                {stat.format === "currency"
                                    ? stat.value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
                                    : stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-[#1A202C] mb-4">Doanh thu theo tháng</h3>
                    <div className="h-64">
                        {monthlyRevenue.length > 0 ? (
                            <Line data={revenueChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: "Doanh thu theo tháng" } } }} />
                        ) : (
                            <p className="text-sm text-[#718096]">Không có dữ liệu doanh thu để hiển thị.</p>
                        )}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-[#1A202C] mb-4">Lợi nhuận theo tháng</h3>
                    <div className="h-64">
                        {monthlyProfit.length > 0 ? (
                            <Line data={profitChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: "Lợi nhuận theo tháng" } } }} />
                        ) : (
                            <p className="text-sm text-[#718096]">Không có dữ liệu lợi nhuận để hiển thị.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};