
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link, useOutletContext } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { ProductCard } from "./Dashboard";

interface Product {
    id: string;
    name: string;
    productCode: string;
    salePrice: number;
    quantity: number;
    brandName: string;
    categoryName: string;
    images: string[];
    isDeleted: boolean;
}

interface OutletContext {
    addToCart: (product: Product) => void;
}

const API_URL = "http://localhost:8080/datn";

// Utility to sanitize query strings
const sanitizeQuery = (input: string) => {
    return input.replace(/[<>&;]/g, "");
};

export default function ProductList() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToCart } = useOutletContext<OutletContext>();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const query = sanitizeQuery(searchParams.get("query") || "");
    const categoryName = sanitizeQuery(searchParams.get("categoryName") || "");

    const fetchProducts = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/products`);
            const productsData = Array.isArray(response.data.result)
                ? response.data.result
                : response.data.result?.data || [];
            if (!Array.isArray(productsData)) throw new Error('Invalid product data format');
            setProducts(productsData.filter((p: Product) => !p.isDeleted));
        } catch (err) {
            toast.error(axios.isAxiosError(err) ? err.message : 'Failed to load products');
        } finally {
        }
    }, []);

    // Increment view count on product click
    const incrementViewCount = useCallback(async (productId: string) => {
        try {
            await axios.post(`${API_URL}/products/${productId}/view`, {});
        } catch (err) {
            console.error(`Failed to increment view count for product ${productId}:`, err);
        }
    }, []);

    const handleProductClick = useCallback((productId: string) => {
        incrementViewCount(productId);
        navigate(`/product/${productId}`);
    }, [incrementViewCount, navigate]);

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter products when query, categoryName, or products change
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
        <div className="container mx-auto p-4 sm:p-6 bg-[#F3F4F6] min-h-screen">
            <div className="mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A8A] mb-4 flex items-center border-b-2 border-[#1E3A8A] border-opacity-40">
                    {query
                        ? `Kết quả tìm kiếm cho "${query}"`
                        : categoryName
                            ? `Danh mục: ${categoryName}`
                            : "Tất cả sản phẩm"}
                </h2>
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="border rounded-lg shadow-md p-4 bg-white flex flex-col h-64 animate-pulse"
                            >
                                <div className="w-full h-40 bg-gray-200 rounded-md mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3 mt-auto"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onClick={handleProductClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-[#1F2937] text-lg">
                            Không tìm thấy sản phẩm phù hợp với "{query || categoryName || "tất cả"}".
                        </p>
                        <Link
                            to="/"
                            className="text-[#3B82F6] underline hover:text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                            aria-label="Quay lại trang chính"
                        >
                            Quay lại trang chính
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
