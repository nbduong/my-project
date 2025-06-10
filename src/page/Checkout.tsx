import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { clearCart, getToken } from '../services/localStorageService';

const API_URL = 'http://localhost:8080/datn';
const SHIPPING_COST = 30000;

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    categoryName?: string;
}

interface CartItem {
    product: Product;
    quantity: number;
}

interface UserInfo {
    id: string;
    username: string;
    address?: string;
}

export function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const token = getToken();

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [shippingMethod, setShippingMethod] = useState('viettelpost');
    const [orderNote, setOrderNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addressError, setAddressError] = useState('');

    const cartItems: CartItem[] = location.state?.cartItems || [];
    const totalAmount: number = location.state?.totalPrice || 0;

    // Validate cart items
    useEffect(() => {
        if (!cartItems.length) {
            toast.error('Giỏ hàng trống. Vui lòng thêm sản phẩm.');
            navigate('/cart');
        }
    }, [cartItems, navigate]);

    // Fetch user info
    useEffect(() => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để tiếp tục.');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        const controller = new AbortController();
        axios
            .get(`${API_URL}/users/myInfo`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal,
            })
            .then((res) => {
                const data = res.data.result;
                setUserInfo({
                    id: data.id,
                    username: data.username,
                    address: data.address || '',
                });
                setShippingAddress(data.address || '');
            })
            .catch((err) => {
                if (axios.isCancel(err)) return;
                if (err.response?.status === 401) {
                    toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                    navigate('/login', { state: { from: location.pathname } });
                } else {
                    toast.error('Lỗi khi tải thông tin người dùng.');
                    navigate('/cart');
                }
            })
            .finally(() => { });

        return () => controller.abort();
    }, [token, navigate, location.pathname]);

    // Handle order submission
    const handleConfirmOrder = useCallback(async () => {
        if (!shippingAddress.trim()) {
            setAddressError('Vui lòng nhập địa chỉ giao hàng.');
            toast.error('Địa chỉ giao hàng là bắt buộc.');
            return;
        }
        setAddressError('');
        setIsSubmitting(true);

        try {
            await axios.post(
                `${API_URL}/orders/place`,
                {
                    userId: userInfo?.id,
                    userName: userInfo?.username,
                    status: 'Chưa thanh toán',
                    shippingAddress,
                    paymentMethod,
                    totalAmount: totalAmount + SHIPPING_COST,
                    shipmentMethod: shippingMethod,
                    orderNote,
                    orderItems: cartItems.map((item) => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                    })),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            toast.success('Đặt hàng thành công!');
            clearCart();
            navigate('/');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                navigate('/login', { state: { from: location.pathname } });
            } else {
                toast.error(axios.isAxiosError(err) ? err.message : 'Đặt hàng thất bại.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [userInfo, shippingAddress, paymentMethod, shippingMethod, orderNote, cartItems, totalAmount, token, navigate, location.pathname]);

    return (
        <div className="py-8 px-4 container mx-auto bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-[#1E3A8A] mb-6">Thanh toán</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Checkout Form */}
                <div>
                    <h2 className="text-xl font-bold text-[#1E3A8A] mb-4">Thông tin thanh toán</h2>
                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleConfirmOrder(); }}>
                        <div>
                            <label htmlFor="username" className="block font-medium text-[#1F2937] mb-1">
                                Tên khách hàng
                            </label>
                            <input
                                id="username"
                                className="w-full border border-gray-300 px-3 py-2 rounded bg-gray-100 pointer-events-none"
                                value={userInfo?.username || ''}
                                disabled
                                aria-label="Tên khách hàng (không thể chỉnh sửa)"
                            />
                        </div>
                        <div>
                            <label htmlFor="shippingAddress" className="block font-medium text-[#1F2937] mb-1">
                                Địa chỉ giao hàng *
                            </label>
                            <textarea
                                id="shippingAddress"
                                className={`w-full border ${addressError ? 'border-[#EF4444]' : 'border-gray-300'} px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-y`}
                                value={shippingAddress}
                                onChange={(e) => {
                                    setShippingAddress(e.target.value);
                                    setAddressError('');
                                }}
                                rows={3}
                                placeholder="Nhập địa chỉ giao hàng..."
                                aria-describedby={addressError ? 'address-error' : undefined}
                                aria-label="Địa chỉ giao hàng"
                            />
                            {addressError && (
                                <p id="address-error" className="text-[#EF4444] text-sm mt-1" role="alert">
                                    {addressError}
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="paymentMethod" className="block font-medium text-[#1F2937] mb-1">
                                Phương thức thanh toán
                            </label>
                            <select
                                id="paymentMethod"
                                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] appearance-none bg-white"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                aria-label="Phương thức thanh toán"
                            >
                                <option value="cash">Tiền mặt khi nhận hàng</option>
                                <option value="bank">Chuyển khoản ngân hàng</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="shippingMethod" className="block font-medium text-[#1F2937] mb-1">
                                Đơn vị vận chuyển
                            </label>
                            <select
                                id="shippingMethod"
                                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] appearance-none bg-white"
                                value={shippingMethod}
                                onChange={(e) => setShippingMethod(e.target.value)}
                                aria-label="Đơn vị vận chuyển"
                            >
                                <option value="viettelpost">ViettelPost</option>
                                <option value="giaohangtietkiem">Giao Hàng Tiết Kiệm</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="orderNote" className="block font-medium text-[#1F2937] mb-1">
                                Ghi chú đơn hàng
                            </label>
                            <textarea
                                id="orderNote"
                                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-y"
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                placeholder="Ví dụ: Giao hàng giờ hành chính..."
                                rows={3}
                                aria-label="Ghi chú đơn hàng"
                            />
                        </div>
                        <div className="text-right font-semibold mt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-[#1F2937]">
                                    <span>Tạm tính:</span>
                                    <span>{totalAmount.toLocaleString()} VNĐ</span>
                                </div>
                                <div className="flex justify-between text-sm text-[#1F2937]">
                                    <span>Phí vận chuyển:</span>
                                    <span>{SHIPPING_COST.toLocaleString()} VNĐ</span>
                                </div>
                                <div className="flex justify-between text-lg text-[#1E3A8A] font-bold">
                                    <span>Thành tiền:</span>
                                    <span>{(totalAmount + SHIPPING_COST).toLocaleString()} VNĐ</span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !!addressError}
                            className="w-full mt-4 bg-[#3B82F6] text-white py-3 rounded-lg hover:bg-[#2563EB] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            aria-label="Xác nhận đơn hàng"
                        >
                            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
                        </button>
                    </form>
                </div>
                {/* Cart Items */}
                <div>
                    <h2 className="text-xl font-bold text-[#1E3A8A] mb-4">Sản phẩm trong giỏ hàng</h2>
                    <div className="max-h-[60vh] overflow-y-auto border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                        {cartItems.length === 0 ? (
                            <p className="text-[#1F2937] text-center">Không có sản phẩm nào.</p>
                        ) : (
                            cartItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 py-3 border-b border-gray-200 last:border-b-0"
                                >
                                    <img
                                        src={`${API_URL}/${item.product.images?.[0] || 'avatar.png'}`}
                                        alt={`${item.product.name} (${item.product.categoryName || 'Product'})`}
                                        className="w-16 h-16 object-contain rounded-lg"
                                        onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-[#1F2937] text-sm line-clamp-2">
                                            {item.product.name}
                                        </h4>
                                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                                        <p className="text-sm text-gray-600">
                                            Giá: {(item.product.price * item.quantity).toLocaleString()} VNĐ
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}