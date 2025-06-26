import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getToken } from "../../services/localStorageService";

// Import interface từ types.ts
import { Order } from "../../services/types";

interface OrderFormProps {
    order: Order;
    onSubmit: (formData: Partial<Order>) => void;
    onCancel: () => void;
    title: string;
}

const OrderForm: React.FC<OrderFormProps> = React.memo(({ order, onSubmit, onCancel, title }) => {
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
        { value: "Paid", label: "Đã thanh toán" },
        { value: "Shipped", label: "Đã giao" },
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

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!validateForm()) return;
            onSubmit(formData);
        },
        [formData, onSubmit, validateForm]
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">{title}</h2>
                {error && (
                    <div className="bg-red-100 text-[#E53E3E] p-2 rounded mb-4 text-sm">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="status"
                            className={`block text-sm font-medium text-[#1A202C] ${formData.status ? 'text-[#2C5282] font-semibold' : ''}`}
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
                                className={`block text-sm font-medium text-[#1A202C] ${formData[field.name as keyof Order] ? 'text-[#2C5282] font-semibold' : ''}`}
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
});

const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void }> = React.memo(({ order, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">Chi tiết đơn hàng #{order.orderNumber}</h2>
                <div className="space-y-3 text-sm">
                    <p>
                        <strong className="text-[#2C5282]">Mã đơn hàng:</strong> {order.orderNumber}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Tên khách hàng:</strong> {order.userName || "Không có"}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Tổng tiền:</strong>{" "}
                        {order.totalAmount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Lợi nhuận:</strong>{" "}
                        {order.totalProfit.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Trạng thái:</strong> {order.status}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Địa chỉ giao hàng:</strong> {order.shippingAddress}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Phương thức thanh toán:</strong> {order.paymentMethod}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Phương thức vận chuyển:</strong> {order.shipmentMethod}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Ghi chú đơn hàng:</strong> {order.orderNote || "Không có"}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Người tạo:</strong> {order.createdBy || "Không có"}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Ngày tạo:</strong>{" "}
                        {new Date(order.createdDate).toLocaleString("vi-VN")}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Người sửa cuối:</strong> {order.lastModifiedBy || "Không có"}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Ngày sửa cuối:</strong>{" "}
                        {order.lastModifiedDate
                            ? new Date(order.lastModifiedDate).toLocaleString("vi-VN")
                            : "Chưa sửa"}
                    </p>
                    <p>
                        <strong className="text-[#2C5282]">Đã xóa:</strong> {order.isDeleted ? "Có" : "Không"}
                    </p>
                    <div>
                        <strong className="text-[#2C5282]">Sản phẩm:</strong>
                        <ul className="list-disc pl-5 mt-1 text-[#1A202C]">
                            {order.orderItems.map((item) => (
                                <li key={item.id}>
                                    {item.productName} (x{item.quantity}) -{" "}
                                    {item.salePrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
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
});

export const ManageOrder: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchField, setSearchField] = useState<"userName" | "orderNumber">("userName");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);
    const API_URL = "http://localhost:8080/datn";

    const statusOptions = [
        { value: "Pending", label: "Chờ xử lý" },
        { value: "Paid", label: "Đã thanh toán" },
        { value: "Shipped", label: "Đã giao" },
        { value: "Cancelled", label: "Đã hủy" },
    ];

    const checkAdmin = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/users/myInfo`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
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
    }, [navigate]);

    const getAllOrders = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
            if (!response.ok) throw new Error("Không thể lấy danh sách đơn hàng");
            const data = await response.json();
            const ordersData = Array.isArray(data.result) ? data.result : data.result.data || [];
            setOrders(ordersData);
        } catch (err: any) {
            console.error("Error fetching orders:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách đơn hàng");
        }
    }, [navigate]);

    const handleEditOrder = useCallback((order: Order) => {
        setSelectedOrder(order);
        setIsEditModalOpen(true);
    }, []);

    const handleViewOrder = useCallback((order: Order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    }, []);

    const handleDeleteOrder = useCallback(async (orderId: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
        try {
            const accessToken = await getToken();
            if (!accessToken) throw new Error("Access token not found");
            const response = await fetch(`${API_URL}/orders/${orderId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
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
    }, [navigate]);

    const handleUpdateOrder = useCallback(async (formData: Partial<Order>) => {
        if (!selectedOrder) return;
        try {
            const accessToken = await getToken();
            if (!accessToken) throw new Error("Access token not found");
            const updateRequest = {
                userName: formData.userName || selectedOrder.userName,
                status: formData.status || selectedOrder.status,
                shippingAddress: formData.shippingAddress || selectedOrder.shippingAddress,
                paymentMethod: formData.paymentMethod || selectedOrder.paymentMethod,
                shipmentMethod: formData.shipmentMethod || selectedOrder.shipmentMethod,
                orderNote: formData.orderNote || selectedOrder.orderNote,
                orderItems: selectedOrder.orderItems,
            };
            const response = await fetch(`${API_URL}/orders/${selectedOrder.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateRequest),
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
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
    }, [navigate, selectedOrder]);

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getToken();
            if (!accessToken) {
                navigate("/login");
                return;
            }
            setIsLoading(true);
            try {
                await Promise.all([checkAdmin(accessToken), getAllOrders(accessToken)]);
            } catch (err: any) {
                setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, checkAdmin, getAllOrders]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/home");
    }, [isLoading, isAdmin, navigate]);

    // Search and filter logic
    const filteredOrders = orders.filter((order) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            searchField === "userName"
                ? (order.userName ?? "").toLowerCase().includes(searchLower)
                : order.orderNumber.toString().includes(searchLower);
        const matchesStatus = !filterStatus || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 bg-[#EDF2F7]">
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                    <table className="w-full border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 text-[#1A202C] text-sm uppercase tracking-wider">
                                <th className="py-3 px-4 border-b text-center w-16 sm:w-20">STT</th>
                                <th className="py-3 px-4 border-b text-center">Mã đơn</th>
                                <th className="py-3 px-4 border-b text-center">Ngày tạo</th>
                                <th className="py-3 px-4 border-b text-center">Tên khách hàng</th>
                                <th className="py-3 px-4 border-b text-center">Tổng tiền</th>
                                <th className="py-3 px-4 border-b text-center">Trạng thái</th>
                                <th className="py-3 px-4 border-b text-center w-32">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: itemsPerPage }).map((_, idx) => (
                                <tr key={idx}>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                    <div className="flex flex-col w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder={`Tìm kiếm theo ${searchField === "userName" ? "tên khách hàng" : "mã đơn hàng"}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 border text-sm border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                        />
                        <div className="flex space-x-4 mt-2">
                            <label className="inline-flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="searchField"
                                    value="userName"
                                    checked={searchField === "userName"}
                                    onChange={() => setSearchField("userName")}
                                    className="form-radio h-4 w-4 text-[#3182CE] focus:ring-[#3182CE]"
                                />
                                <span className="text-sm text-[#1A202C]">Tên khách hàng</span>
                            </label>
                            <label className="inline-flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="searchField"
                                    value="orderNumber"
                                    checked={searchField === "orderNumber"}
                                    onChange={() => setSearchField("orderNumber")}
                                    className="form-radio h-4 w-4 text-[#3182CE] focus:ring-[#3182CE]"
                                />
                                <span className="text-sm text-[#1A202C]">Mã đơn hàng</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                    <label className="block text-sm font-medium text-[#1A202C] mb-1">Lọc theo trạng thái</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full sm:w-48 border text-sm border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                    >
                        <option value="">-- Chọn trạng thái --</option>
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="w-full border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100 text-[#1A202C] text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b text-center w-16 sm:w-20">STT</th>
                            <th className="py-3 px-4 border-b text-center">Mã đơn</th>
                            <th className="py-3 px-4 border-b text-center">Ngày tạo</th>
                            <th className="py-3 px-4 border-b text-center">Tên khách hàng</th>
                            <th className="py-3 px-4 border-b text-center">Tổng tiền</th>
                            <th className="py-3 px-4 border-b text-center">Trạng thái</th>
                            <th className="py-3 px-4 border-b text-center w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: itemsPerPage }).map((_, idx) => (
                                <tr key={idx}>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                </tr>
                            ))
                        ) : paginatedOrders.length > 0 ? (
                            paginatedOrders.map((order, idx) => (
                                <tr
                                    key={order.id}
                                    className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-[#1A202C]">
                                        {(currentPage - 1) * itemsPerPage + idx + 1}
                                    </td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] truncate">{order.orderNumber}</td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] truncate">
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
                                    <td className="py-3 px-4 text-center text-[#1A202C] truncate">{order.userName || "Không có"}</td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] truncate">
                                        {order.totalAmount.toLocaleString("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        })}
                                    </td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] truncate">
                                        <span className={`status-badge text-sm status-${order.status.toLowerCase()}`}>
                                            {statusOptions.find((option) => option.value === order.status)?.label ||
                                                order.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button
                                                onClick={() => handleViewOrder(order)}
                                                className="text-green-500 hover:text-green-600 transition-colors duration-200"
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
                                                className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
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
                                                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-1.5-4.5a2.121 2.121 0 0 1 3 Đồng 3L12 15l-4 1 1-4 9.5-9.5z"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="text-red-500 hover:text-red-600 transition-colors duration-200"
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
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="py-3 px-4 text-center text-[#666]">
                                    Không tìm thấy đơn hàng
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors duration-200`}
                    >
                        Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-md text-sm ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-all duration-200 border border-gray-200`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors duration-200`}
                    >
                        Sau
                    </button>
                </div>
            )}

            {isEditModalOpen && selectedOrder && (
                <OrderForm
                    order={selectedOrder}
                    onSubmit={handleUpdateOrder}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa đơn hàng"
                />
            )}

            {isViewModalOpen && selectedOrder && (
                <OrderDetailsModal order={selectedOrder} onClose={() => setIsViewModalOpen(false)} />
            )}
        </div>
    );
};