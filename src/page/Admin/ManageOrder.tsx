import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { getToken } from "../../services/localStorageService";

interface OrderItem {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    userName: string;
    totalAmount: number;
    status: string;
    shippingAddress: string;
    paymentMethod: string;
    shipmentMethod: string;
    orderNote: string;
    createdDate: string;
    orderItems: OrderItem[];
}

interface OrderFormProps {
    order: Order;
    onSubmit: (formData: Partial<Order>) => void;
    onCancel: () => void;
    title: string;
}

const OrderForm: React.FC<OrderFormProps> = ({ order, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState<Partial<Order>>({
        userName: order.userName,
        status: order.status,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        shipmentMethod: order.shipmentMethod,
        orderNote: order.orderNote,
    });
    const [error, setError] = useState<string | null>(null);

    const statusOptions = [
        { value: "Pending", label: "Chờ xử lý" },
        { value: "Processing", label: "Đang xử lý" },
        { value: "Shipped", label: "Đã giao" },
        { value: "Delivered", label: "Đã nhận" },
        { value: "Cancelled", label: "Đã hủy" },
    ];

    const handleInputChange = useCallback((field: keyof Order, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }, []);

    const validateForm = useCallback(() => {
        if (!formData.status) {
            setError("Vui lòng chọn trạng thái");
            return false;
        }
        if (!formData.shippingAddress || formData.shippingAddress.trim().length < 5) {
            setError("Địa chỉ giao hàng phải có ít nhất 5 ký tự");
            return false;
        }
        if (!formData.paymentMethod || formData.paymentMethod.trim().length < 2) {
            setError("Phương thức thanh toán phải có ít nhất 2 ký tự");
            return false;
        }
        if (!formData.shipmentMethod || formData.shipmentMethod.trim().length < 2) {
            setError("Phương thức vận chuyển phải có ít nhất 2 ký tự");
            return false;
        }
        if (formData.orderNote && formData.orderNote.length > 500) {
            setError("Ghi chú không được vượt quá 500 ký tự");
            return false;
        }
        return true;
    }, [formData]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        onSubmit(formData);
    }, [formData, onSubmit, validateForm]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">{title}</h2>
                {error && (
                    <div className="bg-red-100 text-[#E53E3E] p-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="status"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData.status ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Trạng thái <span className="text-[#E53E3E]">*</span>
                        </label>
                        <select
                            id="status"
                            value={formData.status || ""}
                            onChange={(e) => handleInputChange("status", e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
                        >
                            <option value="">-- Chọn trạng thái --</option>
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {[
                        { label: "Địa chỉ giao hàng", name: "shippingAddress", type: "text", required: true },
                        { label: "Phương thức thanh toán", name: "paymentMethod", type: "text", required: true },
                        { label: "Phương thức vận chuyển", name: "shipmentMethod", type: "text", required: true },
                        { label: "Ghi chú đơn hàng", name: "orderNote", type: "text", required: false },
                    ].map((field) => (
                        <div key={field.name}>
                            <label
                                htmlFor={field.name}
                                className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData[field.name as keyof Order] ? "text-[#2C5282] font-semibold" : ""
                                    }`}
                            >
                                {field.label} {field.required && <span className="text-[#E53E3E]">*</span>}
                            </label>
                            <input
                                type={field.type}
                                id={field.name}
                                value={(formData[field.name as keyof Order] as string) || ""}
                                onChange={(e) => handleInputChange(field.name as keyof Order, e.target.value)}
                                className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                required={field.required}
                            />
                        </div>
                    ))}
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-300 text-[#1A202C] px-4 py-2 rounded-md hover:bg-gray-400 transition-all duration-200"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200"
                        >
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">Chi tiết đơn hàng #{order.id}</h2>
                <div className="space-y-3">
                    <p><strong className="text-[#2C5282]">Tên khách hàng:</strong> {order.userName || "Không có"}</p>
                    <p><strong className="text-[#2C5282]">Tổng tiền:</strong> {order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
                    <p><strong className="text-[#2C5282]">Trạng thái:</strong> {order.status}</p>
                    <p><strong className="text-[#2C5282]">Địa chỉ giao hàng:</strong> {order.shippingAddress}</p>
                    <p><strong className="text-[#2C5282]">Phương thức thanh toán:</strong> {order.paymentMethod}</p>
                    <p><strong className="text-[#2C5282]">Phương thức vận chuyển:</strong> {order.shipmentMethod}</p>
                    <p><strong className="text-[#2C5282]">Ghi chú đơn hàng:</strong> {order.orderNote || "Không có"}</p>
                    <p><strong className="text-[#2C5282]">Ngày tạo:</strong> {new Date(order.createdDate).toLocaleString('vi-VN')}</p>
                    <div>
                        <strong className="text-[#2C5282]">Sản phẩm:</strong>
                        <ul className="list-disc pl-5 mt-1 text-[#1A202C]">
                            {order.orderItems.map((item) => (
                                <li key={item.id}>
                                    {item.productName} (x{item.quantity}) - {item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-[#1A202C] px-4 py-2 rounded-md hover:bg-gray-400 transition-all duration-200"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ManageOrder: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [sortField, setSortField] = useState<keyof Order | "">("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);

    const checkAdmin = async (accessToken: string) => {
        try {
            const response = await fetch("http://localhost:8080/datn/users/myInfo", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể kiểm tra quyền admin");

            const data = await response.json();
            if (data.result?.roles?.some((role: { name: string }) => role.name === "ADMIN")) {
                setIsAdmin(true);
            } else {
                throw new Error("Không có quyền admin");
            }
        } catch (err: any) {
            console.error("Error checking admin status:", err);
            setError(err.message || "Có lỗi xảy ra khi kiểm tra quyền admin");
        }
    };

    const getAllOrders = async (accessToken: string) => {
        try {
            const response = await fetch("http://localhost:8080/datn/orders", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể lấy danh sách đơn hàng");

            const data = await response.json();
            const ordersData = Array.isArray(data.result) ? data.result : data.result.data || [];
            setOrders(ordersData);
        } catch (err: any) {
            console.error("Error fetching orders:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách đơn hàng");
        }
    };

    const handleEditOrder = useCallback((order: Order) => {
        setSelectedOrder(order);
        setIsEditModalOpen(true);
    }, []);

    const handleViewOrder = useCallback((order: Order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    }, []);

    const handleDeleteOrder = async (orderId: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
        try {
            const accessToken = getToken();
            if (!accessToken) throw new Error("Không tìm thấy token");

            const response = await fetch(`http://localhost:8080/datn/orders/${orderId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể xóa đơn hàng");
            }

            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            setSearchTerm("");
            toast.success("Xóa đơn hàng thành công!");
        } catch (err: any) {
            console.error("Error deleting order:", err);
            toast.error(err.message || "Có lỗi xảy ra khi xóa đơn hàng");
        }
    };

    const handleUpdateOrder = async (formData: Partial<Order>) => {
        if (!selectedOrder) return;
        try {
            const accessToken = getToken();
            if (!accessToken) throw new Error("Không tìm thấy token");

            const updateRequest = {
                userName: formData.userName || selectedOrder.userName,
                status: formData.status || selectedOrder.status,
                shippingAddress: formData.shippingAddress || selectedOrder.shippingAddress,
                paymentMethod: formData.paymentMethod || selectedOrder.paymentMethod,
                shipmentMethod: formData.shipmentMethod || selectedOrder.shipmentMethod,
                orderNote: formData.orderNote || selectedOrder.orderNote,
                orderItems: selectedOrder.orderItems,
            };
            const response = await fetch(`http://localhost:8080/datn/orders/${selectedOrder.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateRequest),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể cập nhật đơn hàng");
            }

            const updatedOrder = await response.json();
            setOrders((prev) =>
                prev.map((o) => (o.id === updatedOrder.result.id ? updatedOrder.result : o))
            );
            setIsEditModalOpen(false);
            setSelectedOrder(null);
            toast.success("Cập nhật đơn hàng thành công!");
        } catch (err: any) {
            console.error("Error updating order:", err);
            toast.error(err.message || "Có lỗi xảy ra khi cập nhật đơn hàng");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = getToken();
            if (!accessToken) {
                navigate("/login");
                return;
            }
            await Promise.all([checkAdmin(accessToken), getAllOrders(accessToken)]);
            setIsLoading(false);
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/");
    }, [isLoading, isAdmin, navigate]);

    // Pagination logic
    const filteredOrders = orders.filter((order) =>
        (order.userName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return sortDirection === "asc"
            ? aValue.toString().localeCompare(bValue.toString())
            : bValue.toString().localeCompare(aValue.toString());
    });

    const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
    const paginatedOrders = sortedOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#EDF2F7]">
                <div className="flex flex-col items-center">
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
                    <span className="mt-2 text-[#1A202C]">Đang tải...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-6 text-[#E53E3E] bg-red-100 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-[#EDF2F7]">
            <h1 className="text-2xl font-bold text-[#1A202C] mb-4">Quản lý đơn hàng</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Tìm kiếm đơn hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                    />
                </div>
                <select
                    value={sortField}
                    onChange={(e) => {
                        setSortField(e.target.value as keyof Order);
                        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                    }}
                    className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200 w-full sm:w-auto"
                >
                    <option value="">-- Sắp xếp theo --</option>
                    <option value="userName">Tên khách hàng {sortDirection === "asc" ? "↑" : "↓"}</option>
                    <option value="status">Trạng thái {sortDirection === "asc" ? "↑" : "↓"}</option>
                </select>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                <table className="min-w-full border border-gray-200">
                    <thead>
                        <tr className="bg-[#2C5282] text-white text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-16 sm:w-20">STT</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Ngày tạo</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-left">Tên khách hàng</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-left">Tổng tiền</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-left">Trạng thái</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-24 sm:w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: itemsPerPage }).map((_, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                </tr>
                            ))
                        ) : paginatedOrders.length > 0 ? (
                            paginatedOrders.map((order, index) => (
                                <tr
                                    key={order.id}
                                    className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-[#EDF2F7] transition-colors duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-[#1A202C]">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="py-3 px-4 text-[#1A202C]">
                                        {order.createdDate
                                            ? new Date(order.createdDate).toLocaleString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }).replace(/,/, "")
                                            : "N/A"}
                                    </td>
                                    {/* <td className="py-3 px-4 text-[#1A202C]"></td> */}

                                    <td className="py-3 px-4 text-[#1A202C]">{order.userName}</td>
                                    <td className="py-3 px-4 text-[#1A202C]">{order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                                    <td className="py-3 px-4 text-[#1A202C]">{order.status}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleViewOrder(order)}
                                            className="text-[#3182CE] hover:text-[#2C5282] transition-colors duration-200 mr-2 sm:mr-4"
                                            title="Xem chi tiết"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleEditOrder(order)}
                                            className="text-[#3182CE] hover:text-[#2C5282] transition-colors duration-200 mr-2 sm:mr-4"
                                            title="Chỉnh sửa"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="text-[#E53E3E] hover:text-red-700 transition-colors duration-200"
                                            title="Xóa"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                                />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-3 px-4 text-center text-[#1A202C]">
                                    Không có đơn hàng
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {
                totalPages > 1 && (
                    <div className="flex justify-center mt-4 space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md ${currentPage === 1
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#2C5282] text-white hover:bg-[#3182CE]"
                                } transition-all duration-200`}
                        >
                            Trước
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 rounded-md ${currentPage === page
                                    ? "bg-[#3182CE] text-white"
                                    : "bg-white text-[#1A202C] hover:bg-[#EDF2F7]"
                                    } transition cubiert

                            all duration-200`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#2C5282] text-white hover:bg-[#3182CE]"
                                } transition-all duration-200`}
                        >
                            Sau
                        </button>
                    </div>
                )
            }

            {
                isEditModalOpen && selectedOrder && (
                    <OrderForm
                        order={selectedOrder}
                        onSubmit={handleUpdateOrder}
                        onCancel={() => setIsEditModalOpen(false)}
                        title="Chỉnh sửa đơn hàng"
                    />
                )
            }

            {
                isViewModalOpen && selectedOrder && (
                    <OrderDetailsModal
                        order={selectedOrder}
                        onClose={() => setIsViewModalOpen(false)}
                    />
                )
            }
        </div >
    );
};