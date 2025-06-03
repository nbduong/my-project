import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearCart, getToken } from '../services/localStorageService';

const API_URL = 'http://localhost:8080/datn';

export function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const token = getToken();

    const [userId, setUserId] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [shippingMethod, setShippingMethod] = useState('viettelpost');
    const [orderNote, setOrderNote] = useState('');
    const [userName, setUserName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const cartItems = location.state?.cartItems || [];
    const totalAmount = location.state?.totalPrice || 0;

    useEffect(() => {
        if (!token) {
            alert('Vui lòng đăng nhập');
            navigate('/login');
        } else {
            fetch(`${API_URL}/users/myInfo`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(res => res.json())
                .then(data => {
                    setUserId(data.result.id);
                    setShippingAddress(data.result.address || '');
                    setUserName(data.result.username);
                })
                .catch(() => {
                    alert('Lỗi khi tải thông tin người dùng');
                    navigate('/cart');
                });
        }
    }, [token, navigate]);

    const handleConfirmOrder = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/orders/place`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    userName: userName,
                    status: 'Chưa thanh toán',
                    shippingAddress,
                    paymentMethod,
                    totalAmount: totalAmount.toString(), // đảm bảo là string
                    shipmentMethod: shippingMethod,      // đổi tên từ shippingMethod -> shipmentMethod
                    orderNote,
                    orderItems: cartItems.map((item: any) => ({
                        productId: item.product.id.toString(),   // string
                        quantity: item.quantity.toString(),      // string
                    })),
                }),
            });

            if (!response.ok) throw new Error('Đặt hàng thất bại');
            alert('Đặt hàng thành công!');
            clearCart();
            window.location.href = '/';
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-8">
            {/* LEFT - Form checkout */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Thông tin thanh toán</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block font-medium mb-1 ">Tên khách hàng</label>
                        <input
                            className="w-full border px-3 py-2 rounded pointer-events:none"
                            value={userName}
                            disabled
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Địa chỉ giao hàng</label>
                        <textarea
                            className="w-full border px-3 py-2 rounded"
                            value={shippingAddress}
                            onChange={e => setShippingAddress(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1">Phương thức thanh toán</label>
                        <select
                            className="w-full border px-3 py-2 rounded"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                        >
                            <option value="cash">Tiền mặt</option>
                            <option value="bank">Chuyển khoản</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium mb-1">Đơn vị vận chuyển</label>
                        <select
                            className="w-full border px-3 py-2 rounded"
                            value={shippingMethod}
                            onChange={e => setShippingMethod(e.target.value)}
                        >
                            <option value="viettelpost">ViettelPost</option>
                            <option value="giaohangtietkiem">Giao Hàng Tiết Kiệm</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium mb-1">Ghi chú đơn hàng</label>
                        <textarea
                            className="w-full border px-3 py-2 rounded"
                            value={orderNote}
                            onChange={e => setOrderNote(e.target.value)}
                            placeholder="Ghi chú thêm nếu có..."
                        />
                    </div>

                    <div className="text-right font-bold text-lg mt-6">
                        Tổng cộng: {totalAmount.toLocaleString()} VNĐ
                    </div>

                    <button
                        onClick={handleConfirmOrder}
                        disabled={isSubmitting}
                        className="w-full mt-4 bg-[#371A16] text-white py-3 rounded hover:bg-[#4a2420] disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
                    </button>
                </div>
            </div>

            {/* RIGHT - Cart items preview */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Sản phẩm trong giỏ hàng</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto border p-4 rounded">
                    {cartItems.length === 0 ? (
                        <p>Không có sản phẩm nào.</p>
                    ) : (
                        cartItems.map((item: any, index: number) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 border-b pb-3"
                            >
                                <img
                                    src={`${API_URL}/${item.product.images?.[0] || 'avatar.png'}`}
                                    alt={item.product.name}
                                    className="w-16 h-16 object-cover rounded"
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold">{item.product.name}</h4>
                                    <p>Số lượng: {item.quantity}</p>
                                    <p className="text-sm text-gray-600">
                                        Giá: {item.product.price.toLocaleString()} VNĐ
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
