import { useEffect, useState } from 'react';

interface OrderItem {
    productId: number;
    quantity: number;
}

interface Order {
    id: string;
    shippingAddress: string;
    paymentMethod: string;
    shipmentMethod: string;
    orderNote: string;
    status: string;
    totalAmount: number;
    createdDate: string;
    orderNumber: number;
    orderItems: OrderItem[];
}

const API_URL = 'http://localhost:8080/datn';


export default function UserOrderPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const accessToken = localStorage.getItem("accessToken") || "";

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Lấy thông tin user
                const infoRes = await fetch(`${API_URL}/users/myInfo`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!infoRes.ok) throw new Error('Không thể lấy thông tin người dùng');

                const userInfo = await infoRes.json();
                const username = userInfo.result.username;

                // Lấy danh sách đơn hàng theo username
                const orderRes = await fetch(`${API_URL}/orders/user/${username}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!orderRes.ok) throw new Error('Không thể lấy đơn hàng');

                const data = await orderRes.json();
                setOrders(data.result);
            } catch (err: any) {
                setError(err.message || 'Lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [accessToken]);

    if (loading) return <div className="p-4">Đang tải đơn hàng...</div>;
    if (error) return <div className="p-4 text-red-500">Lỗi: {error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Đơn hàng của bạn</h2>
            {orders.length === 0 ? (
                <p>Bạn chưa có đơn hàng nào.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 bg-white text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border px-4 py-2 text-left">Mã đơn</th>
                                <th className="border px-4 py-2 text-left">Ngày tạo</th>
                                <th className="border px-4 py-2 text-left">Địa chỉ giao hàng</th>
                                <th className="border px-4 py-2 text-left">Giao hàng</th>
                                <th className="border px-4 py-2 text-left">Tổng tiền</th>
                                <th className="border px-4 py-2 text-left">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="border px-4 py-2">{order.orderNumber}</td>
                                    <td className="border px-4 py-2">{order.createdDate
                                        ? new Date(order.createdDate.split('.')[0]).toLocaleString('vi-VN')
                                        : 'Không xác định'}</td>
                                    <td className="border px-4 py-2">{order.shippingAddress}</td>
                                    <td className="border px-4 py-2">{order.shipmentMethod}</td>
                                    <td className="border px-4 py-2">{Number(order.totalAmount).toLocaleString()} VNĐ</td>
                                    <td className="border px-4 py-2">{order.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

}
