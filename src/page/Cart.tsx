import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getToken, loadCart, saveCart } from "../services/localStorageService";

// Import từ types.ts nếu đã tạo
import { Product, CartItem } from "../services/types";

const API_URL = "http://localhost:8080/datn";

export function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const navigate = useNavigate();

    // Load cart from localStorage on mount
    useEffect(() => {
        const loadedCart = loadCart();
        setCartItems(loadedCart);
    }, []);

    // Remove item from cart
    const removeFromCart = (productId: string) => {
        const updatedCart = cartItems.filter((item) => item.product.id !== productId);
        setCartItems(updatedCart);
        saveCart(updatedCart); // Use saveCart service for consistency
    };

    // Update quantity of an item
    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return;
        const updatedCart = cartItems.map((item) =>
            item.product.id === productId ? { ...item, quantity: Math.min(quantity, 999) } : item
        );
        setCartItems(updatedCart);
        saveCart(updatedCart); // Use saveCart service for consistency
    };

    // Calculate total number of items
    const getTotalItems = (): number => cartItems.reduce((total, item) => total + item.quantity, 0);

    // Calculate total price
    const getTotalPrice = (): number =>
        cartItems.reduce((total, item) => total + item.product.salePrice * item.quantity, 0); // Thay price bằng salePrice

    const handlePayment = () => {
        const accessToken = getToken();
        if (!accessToken) {
            navigate("/login", { state: { from: "/cart" } });
            return;
        }
        navigate("/checkout", { state: { cartItems, totalPrice: getTotalPrice() } });
    };

    return (
        <div className="py-8 px-4 container mx-auto">
            <h2 className="text-3xl font-bold text-[#1E3A8A] mb-6">Giỏ hàng</h2>
            {cartItems.length === 0 ? (
                <div className="text-center text-gray-600 py-10">
                    <p className="text-lg">Giỏ hàng của bạn đang trống.</p>
                    <a
                        href="/products"
                        className="mt-4 inline-block bg-[#3B82F6] text-white py-2 px-6 rounded-lg hover:bg-[#2563EB] transition-colors"
                    >
                        Tiếp tục mua sắm
                    </a>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {cartItems.map((item) => (
                            <div
                                key={item.product.id}
                                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <img
                                    src={`${API_URL}/${item.product.images?.[0] || "avatar.png"}`}
                                    alt={item.product.name}
                                    className="w-20 h-20 object-cover rounded-lg mr-4"
                                    onError={(e) => {
                                        e.currentTarget.src = "/avatar.png";
                                    }}
                                />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-800">{item.product.name}</h3>
                                    <p className="text-sm text-gray-600">Mã: {item.product.productCode}</p>
                                    <p className="text-sm text-gray-600">
                                        Đơn giá: {item.product.salePrice.toLocaleString()} VNĐ {/* Thay price bằng salePrice */}
                                    </p>
                                    <div className="flex items-center mt-2">
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                            className="px-3 py-1 bg-gray-200 rounded-l hover:bg-gray-300 transition-colors disabled:opacity-50"
                                            disabled={item.quantity <= 1}
                                            aria-label="Giảm số lượng"
                                        >
                                            -
                                        </button>
                                        <span className="mx-3 text-lg w-12 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                            className="px-3 py-1 bg-gray-200 rounded-r hover:bg-gray-300 transition-colors"
                                            aria-label="Tăng số lượng"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <div className="text-lg font-semibold text-gray-800">
                                    {(item.product.salePrice * item.quantity).toLocaleString()} VNĐ {/* Thay price bằng salePrice */}
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.product.id)}
                                    className="ml-4 text-[#EF4444] hover:text-red-700 font-bold text-xl"
                                    aria-label="Xóa sản phẩm"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex justify-between text-lg font-semibold text-[#1E3A8A] mb-4">
                            <span>Tổng cộng ({getTotalItems()} sản phẩm):</span>
                            <span>{getTotalPrice().toLocaleString()} VNĐ</span>
                        </div>
                        <button
                            onClick={handlePayment}
                            className="w-full bg-[#3B82F6] text-white py-3 rounded-lg hover:bg-[#2563EB] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={cartItems.length === 0}
                            aria-label="Thanh toán"
                        >
                            Thanh toán
                        </button>
                        <a
                            href="/products"
                            className="mt-4 block text-center text-[#3B82F6] hover:text-[#2563EB] underline"
                        >
                            Tiếp tục mua sắm
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}