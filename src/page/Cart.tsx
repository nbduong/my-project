import { useOutletContext, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getToken } from '../services/localStorageService';

interface Product {
    id: number;
    name: string;
    productCode: string;
    price: number;
    images: string[];
    brandName?: string;
    categoryName?: string;
}

interface CartItem {
    product: Product;
    quantity: number;
}

const API_URL = 'http://localhost:8080/datn';

export function CartPage() {
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        getTotalItems,
        getTotalPrice,
    } = useOutletContext<{
        cartItems: CartItem[];
        removeFromCart: (productId: number) => void;
        updateQuantity: (productId: number, quantity: number) => void;
        getTotalItems: () => number;
        getTotalPrice: () => number;
    }>();

    const navigate = useNavigate();
    const [isLoading] = useState(false); // ✅ Loading flag

    const handlePayment = () => {
        const accessToken = getToken();
        if (!accessToken) {
            alert('Vui lòng đăng nhập để thanh toán!');
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

        navigate('/checkout', {
            state: {
                cartItems,
                totalPrice: getTotalPrice(),
            },
        });
    };

    return (
        <div className="py-8 px-4 container mx-auto">
            <h2 className="text-3xl font-bold text-[#371A16] mb-6">Giỏ hàng</h2>
            {cartItems.length === 0 ? (
                <div className="text-center text-gray-600 py-10">
                    <p className="text-lg">Giỏ hàng của bạn đang trống.</p>
                    <a
                        href="/products"
                        className="mt-4 inline-block bg-[#371A16] text-white py-2 px-6 rounded hover:bg-[#4a2420] transition-colors"
                    >
                        Tiếp tục mua sắm
                    </a>
                </div>
            ) : (
                <div className="space-y-4">
                    {cartItems.map((item) => (
                        <div
                            key={item.product.id}
                            className="flex items-center p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            <img
                                src={`${API_URL}/${item.product.images?.[0] || 'avatar.png'}`}
                                alt={item.product.name}
                                className="w-20 h-20 object-cover rounded mr-4"
                                onError={(e) => {
                                    e.currentTarget.src = '/avatar.png';
                                }}
                            />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800">{item.product.name}</h3>
                                <p className="text-sm text-gray-600">Mã sản phẩm: {item.product.productCode}</p>
                                <p className="text-sm text-gray-600">
                                    Đơn giá: {item.product.price.toLocaleString()} VNĐ
                                </p>
                                <div className="flex items-center mt-2">
                                    <button
                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                        className="px-3 py-1 bg-gray-200 rounded-l hover:bg-gray-300 transition-colors"
                                        disabled={item.quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <span className="mx-3 text-lg w-12 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                        className="px-3 py-1 bg-gray-200 rounded-r hover:bg-gray-300 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div className="text-lg font-semibold text-gray-800">
                                {(item.product.price * item.quantity).toLocaleString()} VNĐ
                            </div>
                            <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="ml-4 text-red-500 hover:text-red-700 font-bold text-[32px]"
                            >
                                X
                            </button>
                        </div>
                    ))}
                    <div className="mt-6 p-6 bg-white border rounded-lg shadow-sm">
                        <div className="flex justify-between text-lg font-semibold text-gray-800 mb-4">
                            <span>Tổng cộng ({getTotalItems()} sản phẩm):</span>
                            <span>{getTotalPrice().toLocaleString()} VNĐ</span>
                        </div>
                        <button
                            onClick={handlePayment}
                            className="w-full bg-[#371A16] text-white py-3 rounded-lg hover:bg-[#4a2420] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={cartItems.length === 0 || isLoading}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Thanh toán'}
                        </button>
                        <a
                            href="/products"
                            className="mt-4 block text-center text-[#371A16] hover:text-[#4a2420] underline"
                        >
                            Tiếp tục mua sắm
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
