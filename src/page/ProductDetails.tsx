import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";

// Interface for Product
interface Product {
    id: string;
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

// Interface for Review
interface Review {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
}

const API_URL = "http://localhost:8080/datn";

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useOutletContext<{ addToCart: (product: Product, quantity: number) => void }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mainImage, setMainImage] = useState<string>("");
    const [isFading, setIsFading] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
    const [showBackToTop, setShowBackToTop] = useState(false);

    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${API_URL}/products/${id}`, { method: "GET" });
                if (!response.ok) throw new Error("Không thể lấy thông tin sản phẩm");

                const data = await response.json();
                const fetchedProduct = data.result;
                setProduct(fetchedProduct);
                setMainImage(`${API_URL}/${fetchedProduct.images[0] || "/avatar.png"}`);
            } catch (err: any) {
                setError(err.message || "Có lỗi xảy ra");
            } finally {
                setIsLoading(false);
            }
        };

        const fetchRelatedProducts = async () => {
            try {
                const response = await fetch(`${API_URL}/products?category=${product?.categoryName}`, { method: "GET" });
                if (response.ok) {
                    const data = await response.json();
                    const products = data.result.filter((p: Product) => p.id !== id).slice(0, 4);
                    setRelatedProducts(products);
                }
            } catch (err) {
                console.error("Error fetching related products:", err);
            }
        };

        if (id) {
            fetchProduct();
            fetchRelatedProducts();
        }
    }, [id, navigate, product?.categoryName]);

    // Mock reviews (replace with API call in production)
    useEffect(() => {
        setReviews([
            { id: "1", userName: "Người dùng 1", rating: 4, comment: "Sản phẩm rất tốt, đáng mua!", date: "2025-06-01" },
            { id: "2", userName: "Người dùng 2", rating: 5, comment: "Giao hàng nhanh, chất lượng tuyệt vời.", date: "2025-06-02" },
        ]);
    }, []);

    // Handle scroll for Back to Top button
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const getStatusText = (status: string) => {
        return status === "0" ? (
            <span className="text-red-500 font-bold">Hết hàng!</span>
        ) : (
            <span className="text-green-500 font-bold">Hàng sẵn có</span>
        );
    };

    const handleAddToCart = () => {
        if (product) {
            if (product.status === "0") {
                alert("Sản phẩm hiện đã hết hàng!");
                return;
            }
            if (quantity > product.quantity) {
                alert(`Chỉ còn ${product.quantity} sản phẩm trong kho!`);
                return;
            }
            addToCart(product, quantity);
            alert(`Đã thêm ${quantity} ${product.name} vào giỏ hàng!`);
        }
    };

    const handleBuyNow = () => {
        if (product && product.status === "0") {
            alert("Sản phẩm hiện đã hết hàng!");
            return;
        }
        if (quantity > (product?.quantity || 0)) {
            alert(`Chỉ còn ${product?.quantity} sản phẩm trong kho!`);
            return;
        }
        navigate("/cart", { state: { product, quantity } });
    };

    const handleThumbnailClick = (img: string) => {
        setIsFading(true);
        setTimeout(() => {
            setMainImage(`${API_URL}/${img || "/avatar.png"}`);
            setIsFading(false);
        }, 300);
    };

    const getTruncatedDescription = (description: string | null) => {
        if (!description) return "Không có mô tả";
        const lines = description.split("\n");
        return lines.slice(0, 3).join("\n");
    };

    const handleShare = (platform: string) => {
        const url = window.location.href;
        const text = `Xem sản phẩm ${product?.name} tại đây: ${url}`;
        let shareUrl = "";
        switch (platform) {
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                break;
            case "whatsapp":
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                break;
        }
        window.open(shareUrl, "_blank", "noopener,noreferrer");
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newReview.rating < 1 || newReview.rating > 5) {
            alert("Vui lòng chọn số sao từ 1 đến 5!");
            return;
        }
        if (!newReview.comment.trim()) {
            alert("Vui lòng nhập nhận xét!");
            return;
        }
        const review: Review = {
            id: Date.now().toString(),
            userName: "Người dùng ẩn danh",
            rating: newReview.rating,
            comment: newReview.comment,
            date: new Date().toISOString().split("T")[0],
        };
        setReviews([...reviews, review]);
        setNewReview({ rating: 0, comment: "" });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-5 h-5 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                    </svg>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#6B4E31]"></div>
            </div>
        );
    }

    // if (error) {
    //     return (
    //         <div className="text-center py-10">
    //             <p className="text-red-500 text-lg">{error}</p>
    //             <button
    //                 onClick={() => { setError(null); setIsLoading(true); fetchProduct(); }}
    //                 className="mt-4 px-4 py-2 bg-[#6B4E31] text-white rounded hover:bg-[#8B6F47] transition-colors"
    //             >
    //                 Thử lại
    //             </button>
    //         </div>
    //     );
    // }

    if (!product) {
        return <p className="text-center text-gray-600 text-lg py-10">Không tìm thấy sản phẩm</p>;
    }

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            {/* Breadcrumb */}
            <nav className="text-sm mb-4">
                <ol className="list-none p-0 inline-flex">
                    <li className="flex items-center">
                        <Link to="/" className="text-[#6B4E31] hover:text-[#8B6F47]">Trang chủ</Link>
                        <svg className="fill-current w-3 h-3 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                            <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
                        </svg>
                    </li>
                    <li className="flex items-center">
                        <Link to={`/products?categoryName=${product.categoryName}`} className="text-[#6B4E31] hover:text-[#8B6F47]">{product.categoryName}</Link>
                        <svg className="fill-current w-3 h-3 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                            <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
                        </svg>
                    </li>
                    <li className="text-gray-500">{product.name}</li>
                </ol>
            </nav>

            {/* Main Product Section */}
            <div className="flex flex-col lg:flex-row gap-8 bg-white p-6 rounded-lg shadow-md">
                {/* Image Section */}
                <div className="lg:w-1/2">
                    <div className="relative group">
                        <img
                            src={mainImage}
                            alt={`${product.name} main thumbnail`}
                            className={`w-full h-[400px] object-cover rounded-lg mb-4 transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"} group-hover:scale-105 transform transition-transform duration-300`}
                            onError={(e) => { e.currentTarget.src = "/avatar.png"; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-20 rounded-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto py-2">
                        {product.images.map((img, index) => (
                            <img
                                key={index}
                                src={`${API_URL}/${img || "/avatar.png"}`}
                                alt={`${product.name} thumbnail ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity duration-200"
                                onError={(e) => { e.currentTarget.src = "/avatar.png"; }}
                                onClick={() => handleThumbnailClick(img)}
                            />
                        ))}
                    </div>
                </div>

                {/* Product Info Section */}
                <div className="lg:w-1/2">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">{product.name}</h1>
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

                    {/* Stock Indicator */}
                    {product.status === "1" && product.quantity <= 5 && (
                        <p className="text-orange-500 font-semibold mb-4">
                            Chỉ còn {product.quantity} sản phẩm trong kho!
                        </p>
                    )}

                    {/* Quantity Selector */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">Số lượng:</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                aria-label="Giảm số lượng"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 text-center border rounded px-2 py-1"
                                min="1"
                                max={product.quantity}
                                aria-label="Số lượng sản phẩm"
                            />
                            <button
                                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                aria-label="Tăng số lượng"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Thông số kỹ thuật</h2>
                        <ul className="list-disc list-inside text-gray-600">
                            {Object.entries(product.specifications).map(([key, value]) => (
                                <li key={key} className="mb-1">{key}: {value}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 px-4 py-3 bg-[#6B4E31] text-white rounded-lg hover:bg-[#8B6F47] transition-colors transform hover:scale-105 disabled:opacity-50"
                            disabled={product.status === "0"}
                            aria-label="Thêm vào giỏ hàng"
                        >
                            Thêm vào giỏ hàng
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 px-4 py-3 bg-[#D4A017] text-white rounded-lg hover:bg-[#B88A13] transition-colors transform hover:scale-105 disabled:opacity-50"
                            disabled={product.status === "0"}
                            aria-label="Mua ngay"
                        >
                            Mua ngay
                        </button>
                    </div>

                    {/* Share Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleShare("facebook")}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                            aria-label="Chia sẻ trên Facebook"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.7c0-3 1.8-4.7 4.5-4.7 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.7-1.9 1.9V12h3.3l-.5 3.4h-2.8v8.4A12 12 0 0 0 24 12z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleShare("twitter")}
                            className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
                            aria-label="Chia sẻ trên Twitter"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.4 4.8a9.5 9.5 0 0 1-2.7.7 4.7 4.7 0 0 0 2-2.6 9.5 9.5 0 0 1-3 .1 4.7 4.7 0 0 0-8 4.3A13.3 13.3 0 0 1 1.6 2.5a4.7 4.7 0 0 0 1.5 6.3A4.7 4.7 0 0 1 .9 8v.1a4.7 4.7 0 0 0 3.8 4.6 4.7 4.7 0 0 1-2.1.1 4.7 4.7 0 0 0 4.4 3.3 9.5 9.5 0 0 1-5.9 2 9.5 9.5 0 0 1-1.1-.1 13.3 13.3 0 0 0 7.2 2.1c8.6 0 13.3-7.1 13.3-13.3 0-.2 0-.4-.1-.6a9.5 9.5 0 0 0 2.3-2.4z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleShare("whatsapp")}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            aria-label="Chia sẻ trên WhatsApp"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0a12 12 0 0 0-12 12c0 2.5.8 4.9 2.2 6.9L0 24l5.2-1.6A12 12 0 0 0 24 12 12 12 0 0 0 12 0zm6.6 17.6c-.3.8-1.5 1.5-2.3 1.7-1 .2-2.3.1-3.6-.5-1.5-.7-3-1.8-4.2-3.1-.9-.9-1.7-2-2-3.2-.3-1.2 0-2.4.6-3.3.3-.5.7-.8 1.2-.8h.4c.4 0 .8.2 1.1.6.4.5 1.2 1.5 1.3 1.6.1.2.2.4.1.6-.1.2-.3.5-.5.7-.2.2-.4.4-.5.6-.2.2-.2.5 0 .7.5.8 1.2 1.5 2 2.2.8.6 1.6 1.1 2.5 1.4.2.1.4.1.6-.1.2-.2.5-.4.7-.6.2-.2.4-.2.6-.1.2.1 1.2.6 1.5.7.3.2.5.3.6.5.1.2.1.6-.1.9z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Description Section */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Mô tả sản phẩm</h2>
                <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {showFullDescription
                        ? product.description || "Không có mô tả"
                        : getTruncatedDescription(product.description)}
                </p>
                {product.description && product.description.split("\n").length > 3 && (
                    <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-4 text-blue-500 hover:text-blue-700 transition-colors"
                        aria-label={showFullDescription ? "Thu gọn mô tả" : "Xem thêm mô tả"}
                    >
                        {showFullDescription ? "Thu gọn" : "Xem thêm"}
                    </button>
                )}
            </div>

            {/* Reviews Section */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Đánh giá sản phẩm</h2>
                {reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b pb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold">{review.userName}</span>
                                    <span className="text-gray-500 text-sm">{new Date(review.date).toLocaleDateString("vi-VN")}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">{renderStars(review.rating)}</div>
                                <p className="text-gray-600">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>
                )}

                {/* Add Review Form */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Viết đánh giá của bạn</h3>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Đánh giá của bạn:</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setNewReview({ ...newReview, rating: star })}
                                        className={`w-8 h-8 ${star <= newReview.rating ? "text-yellow-400" : "text-gray-300"}`}
                                        aria-label={`Chọn ${star} sao`}
                                    >
                                        <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Nhận xét:</label>
                            <textarea
                                value={newReview.comment}
                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                className="w-full border rounded px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-[#6B4E31]"
                                rows={4}
                                placeholder="Nhập nhận xét của bạn..."
                                aria-label="Nhận xét sản phẩm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#6B4E31] text-white rounded hover:bg-[#8B6F47] transition-colors"
                            aria-label="Gửi đánh giá"
                        >
                            Gửi đánh giá
                        </button>
                    </form>
                </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Sản phẩm liên quan</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.map((relatedProduct) => (
                            <div
                                key={relatedProduct.id}
                                onClick={() => navigate(`/product/${relatedProduct.id}`)}
                                className="border rounded-lg shadow-md p-4 bg-gray-100 hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
                            >
                                <img
                                    src={`${API_URL}/${relatedProduct.images[0] || "/avatar.png"}`}
                                    alt={`${relatedProduct.name} thumbnail`}
                                    className="w-full h-40 object-cover rounded-md mb-2"
                                    onError={(e) => { e.currentTarget.src = "/avatar.png"; }}
                                />
                                <h3 className="text-sm text-gray-800 font-semibold line-clamp-2">{relatedProduct.name}</h3>
                                <p className="text-lg font-semibold text-gray-800 mt-1">{relatedProduct.price.toLocaleString()}đ</p>
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="text-xs text-green-500 flex items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            className="size-5 mr-1"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                            />
                                        </svg>
                                        {relatedProduct.status === "1" ? "Sẵn sàng" : "Hết hàng"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sticky Add to Cart Button */}
            {product.status === "1" && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
                    <button
                        onClick={handleAddToCart}
                        className="px-6 py-2 bg-[#6B4E31] text-white rounded-lg hover:bg-[#8B6F47] transition-colors"
                        aria-label="Thêm vào giỏ hàng (sticky)"
                    >
                        Thêm vào giỏ hàng
                    </button>
                    <button
                        onClick={handleBuyNow}
                        className="px-6 py-2 bg-[#D4A017] text-white rounded-lg hover:bg-[#B88A13] transition-colors"
                        aria-label="Mua ngay (sticky)"
                    >
                        Mua ngay
                    </button>
                </div>
            )}

            {/* Back to Top Button */}
            {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="fixed bottom-4 right-4 p-3 bg-[#6B4E31] text-white rounded-full shadow-lg hover:bg-[#8B6F47] transition-colors"
                    aria-label="Quay lại đầu trang"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                    </svg>
                </button>
            )}
        </div>
    );
}