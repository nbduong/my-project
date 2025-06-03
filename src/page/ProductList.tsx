import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

interface Product {
    id: string;
    name: string;
    productCode: string;
    price: number;
    images: string[];
    brandName?: string;
    categoryName?: string;
    isDeleted: boolean; // Thêm isDeleted vào interface
}

const API_URL = "http://localhost:8080/datn";

export default function ProductList() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const query = searchParams.get("query") || "";
    const categoryName = searchParams.get("categoryName") || "";

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_URL}/products`, {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error("Không thể lấy danh sách sản phẩm");
            }

            const data = await response.json();
            const productsData = Array.isArray(data.result) ? data.result : data.result?.data || [];
            setProducts(productsData);

            // Lọc sản phẩm dựa trên query hoặc categoryName và isDeleted
            let filtered = productsData.filter((product: Product) => !product.isDeleted);
            if (query) {
                filtered = filtered.filter((product: Product) =>
                    product.name.toLowerCase().includes(query.toLowerCase())
                );
            } else if (categoryName) {
                filtered = filtered.filter(
                    (product: Product) => product.categoryName === categoryName
                );
            }
            setFilteredProducts(filtered);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [navigate]);

    // Cập nhật danh sách sản phẩm khi query hoặc categoryName thay đổi
    useEffect(() => {
        let filtered = products.filter((product: Product) => !product.isDeleted);
        if (query) {
            filtered = filtered.filter((product: Product) =>
                product.name.toLowerCase().includes(query.toLowerCase())
            );
        } else if (categoryName) {
            filtered = filtered.filter(
                (product: Product) => product.categoryName === categoryName
            );
        }
        setFilteredProducts(filtered);
    }, [query, categoryName, products]);

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8 bg-white p-4 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b-2 border-[#331A17] border-opacity-40">
                    {query
                        ? `Kết quả tìm kiếm cho "${query}"`
                        : categoryName
                            ? `Danh mục: ${categoryName}`
                            : "Tất cả sản phẩm"}
                </h2>
                {isLoading ? (
                    <p className="text-center text-gray-500">Đang tải sản phẩm...</p>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => navigate(`/product/${product.id}`)}
                                className="border rounded-lg shadow-md p-2 bg-white hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
                            >
                                <img
                                    src={`${API_URL}/${product.images[0] || '/avatar.png'}`}
                                    alt={`${product.name} thumbnail`}
                                    className="w-full h-40 object-cover rounded-md mb-2"
                                    onError={(e) => {
                                        e.currentTarget.src = '/avatar.png';
                                    }}
                                />
                                <h3 className="text-xs text-gray-800 font-semibold line-clamp-2">{product.name}</h3>
                                <p className="text-xs text-gray-600 mt-1">Mã: {product.productCode}</p>
                                <p className="text-lg font-semibold text-gray-800 mt-1">
                                    {product.price.toLocaleString()} VNĐ
                                </p>
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="text-xs text-green-500 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 mr-1">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        Sẵn sàng
                                    </div>
                                    <div className="">
                                        <button
                                            className="flex items-center px-2 py-1 bg-[#371A16] text-white text-xs rounded hover:bg-yellow-200 hover:text-[#371A16] transition-colors"
                                        >
                                            Mua ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-lg">
                            Không tìm thấy sản phẩm phù hợp với "{query || categoryName || "tất cả"}".
                        </p>
                        <Link to="/" className="text-[#371A17] underline hover:text-yellow-200">
                            Quay lại trang chính
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}