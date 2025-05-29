import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../services/localStorageService";

interface Product {
    id: number;
    name: string;
    productCode: string;
    description: string | null;
    price: number;
    quantity: number;
    brandName: string;
    categoryName: string;
    images: string[];
    specifications: { [key: string]: string };
    status: string; // 0: Hết hàng, 1: Hàng sẵn có
    viewCount: number; // Lượt xem sản phẩm
}

const API_URL = "http://localhost:8080/datn";

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mainImage, setMainImage] = useState<string>(""); // State cho hình ảnh chính
    const [isFading, setIsFading] = useState(false); // State để trigger hiệu ứng fade
    const [showFullDescription, setShowFullDescription] = useState(false); // State để điều khiển hiển thị mô tả

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const accessToken = getToken();
                const response = await fetch(`${API_URL}/products/${id}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (response.status === 401) {
                    navigate("/login");
                    throw new Error("Phiên đăng nhập hết hạn");
                }
                if (!response.ok) {
                    throw new Error("Không thể lấy thông tin sản phẩm");
                }

                const data = await response.json();
                const fetchedProduct = data.result;
                setProduct(fetchedProduct);
                // Khởi tạo hình ảnh chính là hình ảnh đầu tiên
                setMainImage(`${API_URL}/${fetchedProduct.images[0] || "/avatar.png"}`);
            } catch (err: any) {
                setError(err.message || "Có lỗi xảy ra");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id, navigate]);

    const getStatusText = (status: string) => {
        switch (status) {
            case "0":
                return <span className="text-red-500 font-bold">Hết hàng!</span>;
            case "1":
                return <span className="text-green-500 font-bold">Hàng sẵn có</span>;
        }
    };

    const handleAddToCart = () => {
        alert(`Đã thêm ${product?.name} vào giỏ hàng!`);
    };

    const handleBuyNow = () => {
        navigate("/checkout", { state: { product } });
    };

    const handleThumbnailClick = (img: string) => {
        setIsFading(true); // Bắt đầu hiệu ứng fade
        setTimeout(() => {
            setMainImage(`${API_URL}/${img || "/avatar.png"}`); // Cập nhật hình ảnh sau khi fade bắt đầu
            setIsFading(false); // Kết thúc hiệu ứng fade
        }, 300); // Đồng bộ với duration của transition (300ms)
    };

    // Hàm để lấy 3 dòng đầu tiên của mô tả
    const getTruncatedDescription = (description: string | null) => {
        if (!description) return "Không có mô tả";
        const lines = description.split("\n");
        return lines.slice(0, 3).join("\n");
    };

    if (isLoading) return <p className="text-center text-xl text-gray-600">Đang tải...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!product) return <p className="text-center text-gray-600">Không tìm thấy sản phẩm</p>;

    return (
        <div className="container mx-auto p-6 flex flex-col gap-6 bg-gray-50">
            <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2">
                    <img
                        src={mainImage}
                        alt={`${product.name} thumbnail`}
                        className={`w-full object-cover rounded-lg mb-4 transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"}`}
                        onError={(e) => {
                            e.currentTarget.src = "/avatar.png";
                        }}
                    />
                    <div className="flex gap-2 overflow-x-auto">
                        {product.images.map((img, index) => (
                            <img
                                key={index}
                                src={`${API_URL}/${img || "/avatar.png"}`}
                                alt={`${product.name} thumbnail ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-md cursor-pointer"
                                onError={(e) => {
                                    e.currentTarget.src = "/avatar.png";
                                }}
                                onClick={() => handleThumbnailClick(img)}
                            />
                        ))}
                    </div>
                </div>
                <div className="lg:w-1/2">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
                    <p className="text-red-500 text-3xl font-bold mb-4">{product.price.toLocaleString()}đ</p>
                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                        <span>Thương hiệu: <span className="font-bold">{product.brandName}</span></span>
                        <span>|</span>
                        <span>Tình trạng: {getStatusText(product.status)}</span>
                        <span>|</span>
                        <div className="flex items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-5 h-5 mr-1"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                />
                            </svg>
                            <span>{product.viewCount} lượt xem</span>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Thông số kỹ thuật</h2>
                        <ul className="list-disc list-inside text-gray-600">
                            {Object.entries(product.specifications).map(([key, value]) => (
                                <li key={key} className="mb-1">
                                    {key}: {value}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={handleAddToCart}
                            className="px-4 py-2 bg-[#6B4E31] text-white rounded hover:bg-[#8B6F47] transition-colors"
                        >
                            Thêm vào giỏ hàng
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="px-4 py-2 bg-[#D4A017] text-white rounded hover:bg-[#B88A13] transition-colors"
                        >
                            Mua ngay
                        </button>
                    </div>
                </div>
            </div>
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Mô tả</h2>
                <p className="text-gray-600 whitespace-pre-line">
                    {showFullDescription
                        ? product.description || "Không có mô tả"
                        : getTruncatedDescription(product.description)}
                </p>
                {product.description && product.description.split("\n").length > 3 && (
                    <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-blue-500 hover:text-blue-700"
                    >
                        {showFullDescription ? "Thu gọn" : "Xem thêm"}
                    </button>
                )}
            </div>
        </div>
    );
}