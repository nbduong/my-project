import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { clearCart, getToken } from '../services/localStorageService';
import { Product, CartItem, UserInfo } from '../services/types';
import { API_URL, SHIPPING_COST } from '../services/constants';

interface OutletContext {
    addToCart: (product: Product, quantity: number) => void;
    cartItems: CartItem[];
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    clearCart: () => void;
}

interface DiscountResponse {
    id: string;
    startDate: string;
    endDate: string;
    discountPercent?: number;
    discountAmount?: number;
    isGlobal: boolean;
    code: string;
    status: string;
    quantity: number;
    createdBy: string;
    lastModifiedBy: string;
    createdDate: string;
    lastModifiedDate: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
}

export function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const token = getToken();

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [shipmentMethod, setShipmentMethod] = useState('viettelpost');
    const [orderNote, setOrderNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addressError, setShippingAddressError] = useState('');
    const [discountCode, setDiscountCode] = useState('');
    const [discountError, setDiscountError] = useState('');
    const [discountApplied, setDiscountApplied] = useState<DiscountResponse | null>(null);
    const [discounts, setDiscounts] = useState<DiscountResponse[]>([]);
    const { clearCart: clearCartState, cartItems: contextCartItems } = useOutletContext<OutletContext>();
    const [cartItems, setCartItems] = useState<CartItem[]>(location.state?.cartItems || []);
    const [totalAmount, setTotalAmount] = useState<number>(location.state?.totalPrice || 0);

    // Validate cart items and stock
    useEffect(() => {
        if (!cartItems.length) {
            toast.error('Giỏ hàng trống. Vui lòng thêm sản phẩm.');
            navigate('/cart');
            return;
        }
        const invalidItems = cartItems.filter(
            (item) => item.product.quantity != null && item.quantity > item.product.quantity
        );
        if (invalidItems.length > 0) {
            toast.error(
                `Không đủ hàng cho: ${invalidItems
                    .map((item) => item.product.name)
                    .join(', ')}. Vui lòng kiểm tra lại giỏ hàng.`
            );
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
            });

        return () => controller.abort();
    }, [token, navigate, location.pathname]);

    // Fetch discount codes
    useEffect(() => {
        const controller = new AbortController();
        axios
            .get(`${API_URL}/discounts`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal,
            })
            .then((res) => {
                const discountsData = Array.isArray(res.data.result) ? res.data.result : res.data.result?.data || [];
                setDiscounts(discountsData);
                console.log('Fetched discounts:', discountsData);
            })
            .catch((err) => {
                if (axios.isCancel(err)) return;
                console.error('Error fetching discounts:', err);
                toast.error('Không thể tải danh sách mã giảm giá.');
            });

        return () => controller.abort();
    }, [token]);

    // Handle discount code validation
    const handleApplyDiscount = useCallback(() => {
        if (!discountCode.trim()) {
            setDiscountError('Vui lòng nhập mã giảm giá.');
            toast.error('Mã giảm giá không được để trống.');
            return;
        }

        setDiscountError('');
        const discount = discounts.find((d) => d.code.toLowerCase() === discountCode.trim().toLowerCase());

        if (!discount) {
            setDiscountError('Mã giảm giá không tồn tại.');
            toast.error('Mã giảm giá không tồn tại.');
            return;
        }

        console.log('Found discount:', discount);

        if (!discount.isGlobal) {
            setDiscountError('Mã giảm giá này chỉ áp dụng cho sản phẩm cụ thể.');
            toast.error('Mã giảm giá này chỉ áp dụng cho sản phẩm cụ thể.');
            return;
        }
        if (discount.status !== 'ACTIVE') {
            setDiscountError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
            toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
            return;
        }
        if (discount.quantity <= 0) {
            setDiscountError('Mã giảm giá đã được sử dụng hết.');
            toast.error('Mã giảm giá đã được sử dụng hết.');
            return;
        }

        const now = new Date();
        const startDate = new Date(discount.startDate);
        const endDate = new Date(discount.endDate);
        if (now < startDate || now > endDate) {
            setDiscountError('Mã giảm giá không trong thời gian hiệu lực.');
            toast.error('Mã giảm giá không trong thời gian hiệu lực.');
            return;
        }

        setDiscountApplied(discount);
        let newTotal = location.state?.totalPrice || 0;
        if (discount.type === 'PERCENTAGE' && discount.discountPercent) {
            newTotal = newTotal * (1 - discount.discountPercent / 100);
        } else if (discount.type === 'FIXED_AMOUNT' && discount.discountAmount) {
            newTotal = Math.max(0, newTotal - discount.discountAmount);
        }
        setTotalAmount(newTotal);
        toast.success('Áp dụng mã giảm giá thành công!');
    }, [discountCode, discounts, location.state?.totalPrice]);

    // Handle order submission
    const handleConfirmOrder = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (isSubmitting) return;

            if (!shippingAddress.trim()) {
                setShippingAddressError('Vui lòng nhập địa chỉ giao hàng.');
                toast.error('Địa chỉ giao hàng là bắt buộc.');
                return;
            }

            setShippingAddressError('');
            setIsSubmitting(true);
            toast.dismiss();

            try {
                const finalTotalAmount = totalAmount + SHIPPING_COST;
                console.log('Submitting order:', {
                    cartItems,
                    totalAmount: finalTotalAmount,
                    discountCode: discountApplied ? discountCode : undefined,
                });
                const response = await axios.post(
                    `${API_URL}/orders/place`,
                    {
                        userId: userInfo?.id,
                        userName: userInfo?.username || '',
                        status: 'Pending',
                        shippingAddress: shippingAddress,
                        paymentMethod,
                        totalAmount: finalTotalAmount,
                        shipmentMethod,
                        orderNote,
                        discountCode: discountApplied ? discountCode : undefined,
                        orderItems: cartItems.map((item) => ({
                            productId: item.product.id,
                            quantity: item.quantity,
                            price: item.product.finalPrice ?? item.product.salePrice ?? 0,
                        })),
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                console.log('Order response:', response.data);
                if (response.data.code === 0) {
                    try {
                        clearCart(); // Clear localStorage
                        clearCartState(); // Clear cartItems in Layout.tsx
                        setCartItems([]); // Clear local cartItems
                        console.log('Cart cleared in localStorage, state, and local component');
                        console.log('Context cartItems after clear:', contextCartItems);
                    } catch (sideEffectError) {
                        console.error('Error in clearCart or clearCartState:', sideEffectError);
                    }
                    toast.success('Đặt hàng thành công!');
                    setTimeout(() => {
                        console.log('Navigating to homepage');
                        navigate('/', { replace: true, state: { cartItems: [] } });
                    }, 300);
                    return;
                } else {
                    throw new Error(response.data.message || 'Đặt hàng thất bại.');
                }
            } catch (err) {
                console.error('Order error:', err);
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                    navigate('/login', { state: { from: location.pathname } });
                } else {
                    const errorMessage = axios.isAxiosError(err)
                        ? err.response?.data?.message || err.message
                        : 'Đặt hàng thất bại.';
                    toast.error(errorMessage);
                }
            } finally {
                setIsSubmitting(false);
            }
        },
        [
            isSubmitting,
            shippingAddress,
            userInfo,
            paymentMethod,
            shipmentMethod,
            orderNote,
            cartItems,
            totalAmount,
            token,
            navigate,
            location.pathname,
            clearCartState,
            contextCartItems,
            discountCode,
            discountApplied,
        ]
    );

    return (
        <div className="py-8 px-4 container mx-auto bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-[#1E3A8A] mb-6">Thanh toán</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Checkout Form */}
                <div>
                    <h2 className="text-xl font-bold text-[#1E3A8A] mb-4">Thông tin thanh toán</h2>
                    <form className="space-y-6" onSubmit={handleConfirmOrder}>
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
                            <label
                                htmlFor="shippingAddress"
                                className="block font-medium text-[#1F2937] mb-1"
                            >
                                Địa chỉ giao hàng *
                            </label>
                            <textarea
                                id="shippingAddress"
                                className={`w-full border ${addressError ? 'border-[#EF4444]' : 'border-gray-300'
                                    } px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-y`}
                                value={shippingAddress}
                                onChange={(e) => {
                                    setShippingAddress(e.target.value);
                                    setShippingAddressError('');
                                }}
                                rows={3}
                                placeholder="Nhập địa chỉ giao hàng..."
                                aria-describedby={addressError ? 'address-error' : undefined}
                                aria-label="Địa chỉ giao hàng"
                            />
                            {addressError && (
                                <p id="address-error" className="text-sm text-[#EF4444] mt-1" role="alert">
                                    {addressError}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="discountCode"
                                className="block font-medium text-[#1F2937] mb-1"
                            >
                                Mã giảm giá
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="discountCode"
                                    className={`w-full border ${discountError ? 'border-[#EF4444]' : 'border-gray-300'
                                        } px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6]`}
                                    value={discountCode}
                                    onChange={(e) => {
                                        setDiscountCode(e.target.value);
                                        setDiscountError('');
                                        if (!e.target.value.trim()) {
                                            setDiscountApplied(null);
                                            setTotalAmount(location.state?.totalPrice || 0);
                                        }
                                    }}
                                    placeholder="Nhập mã giảm giá..."
                                    aria-describedby={discountError ? 'discount-error' : undefined}
                                    aria-label="Mã giảm giá"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyDiscount}
                                    className="bg-[#3B82F6] text-white px-4 py-2 rounded hover:bg-[#2563EB] transition-colors"
                                    aria-label="Áp dụng mã giảm giá"
                                >
                                    Áp dụng
                                </button>
                            </div>
                            {discountError && (
                                <p id="discount-error" className="text-sm text-[#EF4444] mt-1" role="alert">
                                    {discountError}
                                </p>
                            )}
                            {discountApplied && (
                                <p className="text-sm text-green-600 mt-1">
                                    Đã áp dụng mã {discountCode}: {discountApplied.type === 'PERCENTAGE'
                                        ? `${discountApplied.discountPercent}% giảm`
                                        : `${discountApplied.discountAmount?.toLocaleString()} VNĐ giảm`}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="paymentMethod"
                                className="block font-medium text-[#1F2937] mb-1"
                            >
                                Phương thức thanh toán
                            </label>
                            <select
                                id="paymentMethod"
                                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] appearance-none bg-white"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                aria-label="Select payment method"
                            >
                                <option value="cash">Tiền mặt khi nhận hàng</option>
                                <option value="bank">Chuyển khoản ngân hàng</option>
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="shippingMethod"
                                className="block font-medium text-[#1F2937] mb-1"
                            >
                                Đơn vị vận chuyển
                            </label>
                            <select
                                id="shippingMethod"
                                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] appearance-none bg-white"
                                value={shipmentMethod}
                                onChange={(e) => setShipmentMethod(e.target.value)}
                                aria-label="Select shipment method"
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
                                rows={3}
                                placeholder="Ví dụ: Giao hàng trong giờ hành chính..."
                                aria-label="Order note"
                            />
                        </div>
                        <div className="text-right font-semibold mt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-[#1F2937]">
                                    <span>Tạm tính:</span>
                                    <span>{(location.state?.totalPrice || 0).toLocaleString()} VNĐ</span>
                                </div>
                                {discountApplied && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Giảm giá ({discountCode}):</span>
                                        <span>
                                            -{discountApplied.type === 'PERCENTAGE'
                                                ? `${discountApplied.discountPercent}%`
                                                : `${discountApplied.discountAmount?.toLocaleString()} VNĐ`}
                                        </span>
                                    </div>
                                )}
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
                            aria-label="Confirm order"
                        >
                            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
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
                                        onError={(e) => {
                                            e.currentTarget.src = '/avatar.png';
                                        }}
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-[#1F2937] text-sm line-clamp-2">
                                            {item.product.name}
                                        </h4>
                                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-gray-600">
                                                Giá:{' '}
                                                {((item.product.finalPrice ?? item.product.salePrice ?? 0) * item.quantity).toLocaleString()}{' '}
                                                VNĐ
                                            </p>
                                            {item.product.finalPrice != null &&
                                                item.product.finalPrice < (item.product.salePrice ?? 0) && (
                                                    <p className="text-sm text-gray-500 line-through">
                                                        {((item.product.salePrice ?? 0) * item.quantity).toLocaleString()}{' '}
                                                        VNĐ
                                                    </p>
                                                )}
                                        </div>
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