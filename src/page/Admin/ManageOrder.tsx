import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

    const handleInputChange = (field: keyof Order, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {[
                        { label: "Trạng thái", name: "status", type: "text" },
                        { label: "Địa chỉ giao hàng", name: "shippingAddress", type: "text" },
                        { label: "Phương thức thanh toán", name: "paymentMethod", type: "text" },
                        { label: "Phương thức vận chuyển", name: "shipmentMethod", type: "text" },
                        { label: "Ghi chú đơn hàng", name: "orderNote", type: "text" },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium">{field.label}</label>
                            <input
                                type={field.type}
                                value={(formData[field.name as keyof Order] as string) || ""}
                                onChange={(e) => handleInputChange(field.name as keyof Order, e.target.value)}
                                className="w-full border px-3 py-2 rounded"
                            />
                        </div>
                    ))}
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-400 text-white px-4 py-2 rounded"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded w-full max-w-2xl">
                <h2 className="text-xl font-bold mb-4">Chi tiết đơn hàng #{order.id}</h2>
                <div className="space-y-2">
                    <p><strong>Tên khách hàng:</strong> {order.userName || "Không có"}</p>
                    <p><strong>Tổng tiền:</strong> {order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
                    <p><strong>Trạng thái:</strong> {order.status}</p>
                    <p><strong>Địa chỉ giao hàng:</strong> {order.shippingAddress}</p>
                    <p><strong>Phương thức thanh toán:</strong> {order.paymentMethod}</p>
                    <p><strong>Phương thức vận chuyển:</strong> {order.shipmentMethod}</p>
                    <p><strong>Ghi chú đơn hàng:</strong> {order.orderNote || "Không có"}</p>
                    <p><strong>Ngày tạo:</strong> {new Date(order.createdDate).toLocaleString('vi-VN')}</p>
                    <div>
                        <strong>Sản phẩm:</strong>
                        <ul className="list-disc pl-5 mt-1">
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
                        className="bg-gray-400 text-white px-4 py-2 rounded"
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
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [sortField, setSortField] = useState<keyof Order | "">("");
    const [searchTerm, setSearchTerm] = useState("");

    const checkAdmin = async (accessToken: string) => {
        try {
            const response = await fetch("http://localhost:8080/datn/users/myInfo", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể kiểm tra quyền admin");

            const data = await response.json();
            if (data.result.roles?.some((role: { name: string }) => role.name === "ADMIN")) {
                setIsAdmin(true);
            }
        } catch (err) {
            console.error("Error checking admin status:", err);
            setError("Có lỗi xảy ra khi kiểm tra quyền admin");
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
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Có lỗi xảy ra khi tải danh sách đơn hàng");
        }
    };

    const handleEditOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsEditModalOpen(true);
    };

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    };

    const handleDeleteOrder = async (orderId: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
        try {
            const accessToken = getToken();
            const response = await fetch(`http://localhost:8080/datn/orders/${orderId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể xóa đơn hàng");
            setOrders(orders.filter((o) => o.id !== orderId));
            window.location.reload();
        } catch (err) {
            console.error("Error deleting order:", err);
            setError("Có lỗi xảy ra khi xóa đơn hàng");
        }
    };

    const handleUpdateOrder = async (formData: Partial<Order>) => {
        if (!selectedOrder) return;
        try {
            const accessToken = getToken();
            const updateRequest = {
                userName: formData.userName,
                status: formData.status,
                shippingAddress: formData.shippingAddress,
                paymentMethod: formData.paymentMethod,
                shipmentMethod: formData.shipmentMethod,
                orderNote: formData.orderNote,
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

            alert("Cập nhật đơn hàng thành công!");
            const updatedOrder = await response.json();
            setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
            setIsEditModalOpen(false);
            setSelectedOrder(null);
            window.location.reload();
        } catch (err: any) {
            console.error("Error updating order:", err);
            setError(err.message || "Có lỗi xảy ra khi cập nhật đơn hàng");
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

    if (isLoading) return <p className="text-center">Đang tải...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    const filteredOrders = orders.filter((order) =>
        (order.userName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return aValue.toString().localeCompare(bValue.toString());
    });

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Quản lý đơn hàng</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm đơn hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border px-3 py-2 rounded w-64"
                    />
                </div>
                <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as keyof Order)}
                    className="border px-3 py-2 rounded"
                >
                    <option value="">-- Sắp xếp theo --</option>
                    <option value="userName">Tên khách hàng</option>
                    <option value="status">Trạng thái</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
                    <thead>
                        <tr className="bg-[#371A16] text-white text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Số thứ tự</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Ngày tạo</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-start">Tên khách hàng</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-start">Tổng tiền</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-start">Trạng thái</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedOrders.length > 0 ? sortedOrders.map((order, index) => (
                            <tr
                                key={order.id}
                                className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors duration-200`}
                            >
                                <td className="py-3 px-4 text-center text-gray-700">{index+1}</td>
                                <td className="py-3 px-4 text-gray-700">{order.createdDate
                                    ? new Date(order.createdDate).toLocaleString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }).replace(/,/, "")
                                    : "N/A"}</td>
                                <td className="py-3 px-4 text-gray-700">{order.userName}</td>
                                <td className="py-3 px-4 text-gray-700">{order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                                <td className="py-3 px-4 text-gray-700">{order.status}</td>
                                <td className="py-3 px-4 text-center">
                                    <button
                                        onClick={() => handleViewOrder(order)}
                                        className="text-green-500 hover:text-green-700 transition-colors duration-200 mr-4"
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
                                        className="text-blue-500 hover:text-blue-700 transition-colors duration-200 mr-4"
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
                                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
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
                        )) : (
                            <tr>
                                <td colSpan={5} className="py-3 px-4 text-center text-gray-500">
                                    Không có đơn hàng
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isEditModalOpen && selectedOrder && (
                <OrderForm
                    order={selectedOrder}
                    onSubmit={handleUpdateOrder}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa đơn hàng"
                />
            )}

            {isViewModalOpen && selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setIsViewModalOpen(false)}
                />
            )}
        </div>
    );
};