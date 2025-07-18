import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { getToken, saveCart } from "../services/localStorageService";

// Interface definitions remain unchanged
interface Product {
    id: string;
    name: string;
    productCode: string;
    description: string | null;
    salePrice: number | null;
    finalPrice?: number | null;
    discountPercent?: number | null;
    discountAmount?: number | null;
    discountCode?: string | null;
    quantity: number;
    brandName: string;
    categoryName: string;
    images: string[];
    specifications: { [key: string]: string };
    status: string;
    viewCount: number;
    isDeleted: boolean;
}

interface CartItem {
    product: Product;
    quantity: number;
}

interface Comment {
    id: string;
    content: string;
    createdBy: string;
    createdDate: string;
}

interface CommentRequest {
    content: string;
    productId: string;
    userId: string;
}

interface OutletContext {
    addToCart: (product: Product, quantity: number) => void;
}

const API_URL = "http://localhost:8080/datn";

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useOutletContext<OutletContext>();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mainImage, setMainImage] = useState<string>("");
    const [isFading, setIsFading] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);
    const [showSticky, setShowSticky] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const thumbnailRef = useRef<HTMLImageElement>(null);
    const lastScrollY = useRef(0);
    const accessToken = getToken();

    // Fetch user info only if token exists (for commenting)
    useEffect(() => {
        if (!accessToken) return; // Skip if no token

        const fetchUserInfo = async () => {
            try {
                const response = await fetch(`${API_URL}/users/myInfo`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Lỗi khi lấy thông tin user: ${response.statusText}`);
                }

                const data = await response.json();
                setUserId(data.result.id);
            } catch (err: any) {
                console.error("Failed to fetch user info:", err);
            }
        };

        fetchUserInfo();
    }, [accessToken]);

    // Fetch product details (no auth required)
    useEffect(() => {
        if (!id) {
            setError("Không tìm thấy ID sản phẩm.");
            setIsLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${API_URL}/products/${id}`, {
                    method: "GET",
                    // No Authorization header to allow unauthenticated access
                });

                if (!response.ok) {
                    throw new Error(`Lỗi khi lấy sản phẩm: ${response.statusText}`);
                }

                const data = await response.json();
                const fetchedProduct = data.result;
                if (!fetchedProduct) {
                    throw new Error("Không tìm thấy sản phẩm trong response.");
                }
                setProduct(fetchedProduct);
                setMainImage(`${API_URL}/${fetchedProduct.images[0] || "/avatar.png"}`);
            } catch (err: any) {
                setError(err.message || "Có lỗi xảy ra khi tải sản phẩm.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    // Fetch comments (no auth required)
    useEffect(() => {
        if (!id) return;

        const fetchComments = async () => {
            try {
                setIsLoadingComments(true);
                const response = await fetch(`${API_URL}/comment/${id}`, {
                    method: "GET",
                    // No Authorization header to allow unauthenticated access
                });

                if (!response.ok) {
                    throw new Error("Không thể tải bình luận.");
                }

                const data = await response.json();
                setComments(data.result || []);
            } catch (err: any) {
                toast.error(err.message || "Không thể tải bình luận.");
            } finally {
                setIsLoadingComments(false);
            }
        };

        fetchComments();
    }, [id]);

    // Handle comment submission (requires auth)
    const handleCommentSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!accessToken || !userId) {
                toast.error("Vui lòng đăng nhập để bình luận.");
                navigate("/login", { state: { from: `/product/${id}` } });
                return;
            }
            if (!commentInput.trim()) {
                toast.error("Nội dung bình luận không được để trống.");
                return;
            }

            try {
                const commentRequest: CommentRequest = {
                    content: commentInput,
                    productId: id!,
                    userId: userId,
                };
                const response = await fetch(`${API_URL}/comment`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(commentRequest),
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        toast.error("Vui lòng đăng nhập để bình luận.");
                        navigate("/login", { state: { from: `/product/${id}` } });
                    }
                    throw new Error("Không thể gửi bình luận.");
                }

                const data = await response.json();
                setComments((prev) => [...prev, data.result]);
                setCommentInput("");
                toast.success("Bình luận đã được gửi!");
            } catch (err: any) {
                toast.error(err.message || "Không thể gửi bình luận.");
            }
        },
        [id, userId, commentInput, navigate, accessToken]
    );

    // Handle comment deletion (requires auth)
    const handleDeleteComment = useCallback(
        async (commentId: string) => {
            if (!accessToken || !userId) {
                toast.error("Vui lòng đăng nhập để xóa bình luận.");
                navigate("/login", { state: { from: `/product/${id}` } });
                return;
            }

            try {
                const response = await fetch(`${API_URL}/comment/${commentId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        toast.error("Vui lòng đăng nhập để xóa bình luận.");
                        navigate("/login", { state: { from: `/product/${id}` } });
                    }
                    throw new Error("Không thể xóa bình luận.");
                }

                setComments((prev) => prev.filter((comment) => comment.id !== commentId));
                toast.success("Bình luận đã được xóa!");
            } catch (err: any) {
                toast.error(err.message || "Không thể xóa bình luận.");
            }
        },
        [id, navigate, accessToken, userId]
    );

    // Fetch related products (no auth required)
    useEffect(() => {
        if (!product || !id) return;

        const fetchRelatedProducts = async () => {
            try {
                setIsLoadingRelated(true);
                const response = await fetch(`${API_URL}/products?category=${product.categoryName}`, {
                    method: "GET",
                    // No Authorization header to allow unauthenticated access
                });

                if (!response.ok) {
                    throw new Error("Không thể tải sản phẩm liên quan.");
                }

                const data = await response.json();
                const products = data.result.filter((p: Product) => p.id !== id && !p.isDeleted).slice(0, 4);
                setRelatedProducts(products);
            } catch (err: any) {
                toast.error(err.message || "Không thể tải sản phẩm liên quan.");
            } finally {
                setIsLoadingRelated(false);
            }
        };

        fetchRelatedProducts();
    }, [product, id]);

    // Handle sticky button visibility on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setShowSticky(currentScrollY <= lastScrollY.current || currentScrollY < 100);
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Focus first thumbnail on load
    useEffect(() => {
        thumbnailRef.current?.focus();
    }, []);

    const getStatusText = (status: string) => {
        return status === "0" ? (
            <span className="text-[#EF4444] font-bold">Hết hàng!</span>
        ) : (
            <span className="text-[#10B981] font-bold">Hàng sẵn có</span>
        );
    };

    const addToCartLogic = useCallback(
        (navigateToCart: boolean = false) => {
            if (!product) return;
            if (product.status === "0") {
                toast.error("Sản phẩm hiện đã hết hàng!");
                return;
            }

            const existingCart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
            const existingItemIndex = existingCart.findIndex((item) => item.product.id === product.id);
            let newQuantity = quantity;

            if (existingItemIndex !== -1) {
                newQuantity = existingCart[existingItemIndex].quantity + quantity;
                if (newQuantity > product.quantity) {
                    toast.error(`Không thể thêm! Chỉ còn ${product.quantity} sản phẩm trong kho.`);
                    return;
                }
            } else if (quantity > product.quantity) {
                toast.error(`Không thể thêm! Chỉ còn ${product.quantity} sản phẩm trong kho.`);
                return;
            }

            addToCart(product, quantity);
            toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng!`);

            let updatedCart: CartItem[];
            if (existingItemIndex !== -1) {
                updatedCart = [...existingCart];
                updatedCart[existingItemIndex].quantity = newQuantity;
            } else {
                const cartItem: CartItem = { product, quantity };
                updatedCart = [...existingCart, cartItem];
            }
            saveCart(updatedCart);

            if (navigateToCart) {
                navigate("/cart", { state: { product, quantity } });
            }
        },
        [product, quantity, navigate, addToCart]
    );

    const handleAddToCart = useCallback(() => addToCartLogic(), [addToCartLogic]);
    const handleBuyNow = useCallback(() => addToCartLogic(true), [addToCartLogic]);

    const handleThumbnailClick = useCallback((img: string) => {
        setIsFading(true);
        setTimeout(() => {
            setMainImage(`${API_URL}/${img || "/avatar.png"}`);
            setIsFading(false);
        }, 300);
    }, []);

    const getTruncatedDescription = (description: string | null) => {
        if (!description) return "Không có mô tả";
        const lines = description.split("\n");
        return lines.slice(0, 3).join("\n");
    };

    const handleShare = useCallback(
        (platform: string) => {
            const url = window.location.href;
            const text = `Xem sản phẩm ${product?.name} tại đây: ${url}`;
            let shareUrl = "";
            switch (platform) {
                case "facebook":
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    break;
                case "twitter":
                    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                    break;
                case "whatsapp":
                    shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    break;
            }
            window.open(shareUrl, "_blank", "noopener,noreferrer");
        },
        [product?.name]
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#3B82F6]"></div>
            </div>
        );
    }

    if (error || !product) {
        return <p className="text-center text-[#1F2937] text-lg py-10">{error || "Không tìm thấy sản phẩm"}</p>;
    }

    const isDiscounted =
        product.finalPrice != null && product.salePrice != null && product.finalPrice < product.salePrice;

    return (
        <div className="container mx-auto p-4 sm:p-6 bg-[#F3F4F6] min-h-screen">
            {/* Main Product Section */}
            <div className="flex flex-col lg:flex-row

 gap-8 bg-white p-4 sm:p-6 rounded-lg shadow-md relative">
                {isDiscounted && (
                    <span className="absolute top-4 right-4 bg-[#EF4444] text-white text-xs font-semibold px-2 py-1 rounded">
                        Sale
                    </span>
                )}
                <div className="lg:w-1/2">
                    <div className="relative group">
                        <img
                            src={mainImage}
                            alt={`${product.name} (${product.categoryName}) - Hình ảnh chính`}
                            className={`w-full h-64 sm:h-96 object-cover rounded-lg mb-4 transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"} group-hover:scale-105 transform transition-transform duration-300`}
                            onError={(e) => {
                                e.currentTarget.src = "/avatar.png";
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-20 rounded-lg">
                            <svg
                                className="w-10 h-10 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                ></path>
                            </svg>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto py-2">
                        {product.images.map((img, index) => (
                            <img
                                key={index}
                                src={`${API_URL}/${img || "/avatar.png"}`}
                                alt={`${product.name} (${product.categoryName}) - Hình ảnh ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                onError={(e) => {
                                    e.currentTarget.src = "/avatar.png";
                                }}
                                onClick={() => handleThumbnailClick(img)}
                                ref={index === 0 ? thumbnailRef : null}
                                tabIndex={0}
                            />
                        ))}
                    </div>
                </div>

                <div className="lg:w-1/2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A8A] mb-3">{product.name}</h1>
                    <div className="flex items-center gap-2 mb-4">
                        {isDiscounted ? (
                            <>
                                <p className="text-2xl sm:text-3xl font-bold text-[#EF4444]">
                                    {(product.finalPrice ?? product.salePrice ?? 0).toLocaleString()}đ
                                </p>
                                <p className="text-lg text-gray-500 line-through">
                                    {(product.salePrice ?? 0).toLocaleString()}đ
                                </p>
                            </>
                        ) : (
                            <p className="text-2xl sm:text-3xl font-bold text-[#EF4444]">
                                {(product.salePrice ?? 0).toLocaleString()}đ
                            </p>
                        )}
                    </div>
                    <div className="flex justify-between items-center gap-4 text-[#1F2937] mb-4">
                        <span className="flex">
                            Thương hiệu: <span className="font-bold">{product.brandName}</span>
                        </span>
                        <span className="hidden sm:inline">|</span>
                        <span className="flex">Tình trạng: {getStatusText(product.status)}</span>
                        <span className="hidden sm:inline">|</span>
                        <div className="flex items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="size-6"
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

                    {product.status === "1" && product.quantity <= 2 && (
                        <p className="text-[#EF4444] font-semibold mb-4">Chỉ còn {product.quantity} sản phẩm!</p>
                    )}

                    <div className="mb-6">
                        <label className="block text-[#1F2937] font-medium mb-2">Số lượng:</label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-3 py-2 bg-gray-200 rounded-full hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                aria-label="Giảm số lượng"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setQuantity(Math.min(Math.max(1, val), product.quantity));
                                }}
                                className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                min="1"
                                max={product.quantity.toString()}
                                aria-label="Số lượng sản phẩm"
                            />
                            <button
                                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                                className="px-3 py-2 bg-gray-200 rounded-full hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                aria-label="Tăng số lượng"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-[#1F2937] mb-2">Thông số kỹ thuật</h2>
                        <ul className="list-disc list-inside text-[#1F2937]">
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
                            className="flex-1 w-full py-3 px-4 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                            disabled={product.status === "0"}
                            aria-label="Thêm vào giỏ hàng"
                        >
                            Thêm vào giỏ hàng
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 w-full py-3 px-4 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                            disabled={product.status === "0"}
                            aria-label="Mua ngay"
                        >
                            Mua ngay
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleShare("facebook")}
                            className="p-2 bg-[#3B82F6] text-white rounded-full hover:bg-[#2563EB] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                            aria-label="Chia sẻ trên Facebook"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.7c0-3 1.8-4.7 4.5-4.7 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.7-1.9 1.9V12h3.3l-.5 3.4h-2.8v8.4A12 12 0 0 0 24 12z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleShare("twitter")}
                            className="p-2 bg-[#1DA1F2] text-white rounded-full hover:bg-[#1A91DA] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                            aria-label="Chia sẻ trên Twitter"
                        >

                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M23.4 4.8a9.5 9.5 0 0 1-2.7.7 4.7 4.7 0 0 0 2-2.6 9.5 9.5 0 0 1-3 .1 4.7 4.7 0 0 0-8 4.3A13.3 13.3 0 0 1 1.6 2.5a4.7 4.7 0 0 0 1.5 6.3A4.7 4.7 0 0 1 .9 8v.1a4.7 4.7 0 0 0 3.8 4.6 4.7 4.7 0 0 1-2.1.1 4.7 4.7 0 0 0 4.4 3.3 9.5 9.5 0 0 1-5.9 2 9.5 9.5 0 0 1-1.1-.1 13.3 13.3 0 0 0 7.2 2.1c8.6 0 13.3-7.1 13.3-13.3 0-.2 0-.4-.1-.6a9.5 9.5 0 0 0 2.3-2.4z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleShare("whatsapp")}
                            className="p-2 bg-[#25D366] text-white rounded-full hover:bg-[#20BD57] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                            aria-label="Chia sẻ trên WhatsApp"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 listings 24 24" aria-hidden="true">
                                <path d="M12 0a12 12 0 0 0-12 12c0 2.5.8 4.9 2.2 6.9L0 24l5.2-1.6A12 12 0 0 0 24 12 12 12 0 0 0 12 0zm6.6 17.6c-.3.8-1.5.1.5-2.3 1.7-1 .2-2.3.1-3.6-.5-1.5-.7-3-1.8-4.2-3.1-.9-.9-1.7-2-3.2-.3-1.2 0-2 Fav 2.4-.5.5 1.1.6.4 1.3 1.6.2.6-.1.8-.1.2.4-.5.7-.6.7-.5.6-.1.9-.1 1.5.6 1.3.6-.5.7-.6.7-.5.6 0 .7.4 1.5 2.2.2.8 1.6 1.4.2.5.6-.1.9z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Description Section */}
            <div className="mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-[#1E3A8A] mb-4">Mô tả sản phẩm</h2>
                <p className="text-[#1F2937] whitespace-pre-line leading-relaxed">
                    {showFullDescription ? product.description || "Không có mô tả" : getTruncatedDescription(product.description)}
                </p>
                {product.description && product.description.split("\n").length > 3 && (
                    <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-4 text-[#3B82F6] hover:underline focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        aria-label={showFullDescription ? "Thu gọn mô tả" : "Xem thêm mô tả"}
                    >
                        {showFullDescription ? "Thu gọn" : "Xem thêm"}
                    </button>
                )}
            </div>

            {/* Comments Section */}
            <div className="mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-[#1E3A8A] mb-4">Bình luận</h2>
                {isLoadingComments ? (
                    <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : comments.length === 0 ? (
                    <p className="text-[#1F2937] text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                    <div className="space-y-6">
                        {comments.map((comment) => {
                            const isAdmin = comment.createdBy.toUpperCase() === "ADMIN";
                            return (
                                <div
                                    key={comment.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg transition-colors duration-200 ${isAdmin ? "bg-blue-50 border-l-4 border-blue-500" : "bg-gray-50 hover:bg-gray-100"
                                        }`}
                                >
                                    <div className="flex-shrink-0">
                                        <img
                                            src={isAdmin ? "/logo.png" : "/avatar.png"}
                                            alt={`Avatar của ${comment.createdBy}`}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-semibold ${isAdmin ? "text-blue-700" : "text-[#1F2937]"}`}>
                                                    {comment.createdBy}
                                                </p>
                                                {isAdmin && (
                                                    <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                                                        ADMIN
                                                    </span>
                                                )}
                                                <p className="text-sm text-gray-500">
                                                    {new Date(comment.createdDate).toLocaleString("vi-VN")}
                                                </p>
                                            </div>
                                            {userId && comment.createdBy === userId && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-[#EF4444] hover:text-[#B91C1C] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#EF4444] p-1"
                                                    aria-label="Xóa bình luận"
                                                >
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[#1F2937] mt-2">{comment.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {userId ? (
                    <form onSubmit={handleCommentSubmit} className="mt-6">
                        <label className="block text-[#1F2937] font-medium mb-2">Thêm bình luận của bạn:</label>
                        <div className="flex items-start gap-4">
                            <img
                                src="/avatar.png"
                                alt="Avatar của bạn"
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            <div className="flex-1">
                                <textarea
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-y transition-shadow duration-200"
                                    rows={4}
                                    placeholder="Viết bình luận của bạn..."
                                    aria-label="Nội dung bình luận"
                                ></textarea>
                                <div className="flex justify-end mt-3">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                        aria-label="Gửi bình luận"
                                    >
                                        Gửi bình luận
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="mt-6 text-center">
                        <p className="text-[#1F2937] mb-4">Vui lòng đăng nhập để bình luận.</p>
                        <button
                            onClick={() => navigate("/login", { state: { from: `/product/${id}` } })}
                            className="px-6 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        >
                            Đăng nhập để bình luận
                        </button>
                    </div>
                )}
            </div>

            {/* Related Products Section */}
            {isLoadingRelated ? (
                <div className="mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-[#1E3A8A] mb-4">Sản phẩm liên quan</h2>
                    <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            ) : (
                relatedProducts.length > 0 && (
                    <div className="mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-[#1E3A8A] mb-4">Sản phẩm liên quan</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => {
                                const isRelatedDiscounted =
                                    relatedProduct.finalPrice != null &&
                                    relatedProduct.salePrice != null &&
                                    relatedProduct.finalPrice < relatedProduct.salePrice;
                                return (
                                    <div
                                        key={relatedProduct.id}
                                        onClick={() => navigate(`/product/${relatedProduct.id}`)}
                                        className="border border-gray-200 rounded-lg shadow-md p-4 bg-white hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && navigate(`/product/${relatedProduct.id}`)}
                                    >
                                        <img
                                            src={`${API_URL}/${relatedProduct.images[0] || "/avatar.png"}`}
                                            alt={`${relatedProduct.name} (${relatedProduct.categoryName})`}
                                            className="w-full h-40 object-cover rounded-md mb-2"
                                            onError={(e) => {
                                                e.currentTarget.src = "/avatar.png";
                                            }}
                                        />
                                        <h3 className="text-sm text-[#1F2937] font-semibold line-clamp-2">{relatedProduct.name}</h3>
                                        <div className="mt-1 flex items-center gap-2">
                                            {isRelatedDiscounted ? (
                                                <>
                                                    <p className="text-lg font-semibold text-[#EF4444]">
                                                        {(relatedProduct.finalPrice ?? relatedProduct.salePrice ?? 0).toLocaleString()}đ
                                                    </p>
                                                    <p className="text-sm text-gray-500 line-through">
                                                        {(relatedProduct.salePrice ?? 0).toLocaleString()}đ
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-lg font-semibold text-[#1F2937]">
                                                    {(relatedProduct.salePrice ?? 0).toLocaleString()}đ
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-auto flex items-center justify-between">
                                            <div className="text-xs text-[#10B981] flex items-center">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="1.5"
                                                    stroke="currentColor"
                                                    className="size-5 mr-1"
                                                    aria-hidden="true"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                {relatedProduct.status === "1" ? "Sẵn sàng" : "Hết hàng"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            )}

            {product.status === "1" && (
                <div
                    className={`fixed bottom-4 sm:bottom-16 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg flex items-center gap-4 z-50 transition-opacity duration-300 ${showSticky ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                >
                    <button
                        onClick={handleAddToCart}
                        className="px-6 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        aria-label="Thêm vào giỏ hàng (sticky)"
                    >
                        Thêm vào giỏ hàng
                    </button>
                    <button
                        onClick={handleBuyNow}
                        className="px-6 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        aria-label="Mua ngay (sticky)"
                    >
                        Mua ngay
                    </button>
                </div>
            )}
        </div>
    );
}