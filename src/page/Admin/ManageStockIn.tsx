import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getToken } from "../../services/localStorageService";

interface Product {
    id: string;
    name: string;
    code: string;
}

interface StockIn {
    id: string;
    parcelCode: string | null;
    productName: string | null;
    productCode: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    createdBy: string | null;
    createdDate: string;
    lastModifiedDate: string | null;
    lastModifiedBy: string | null;
}

interface StockInRequest {
    id?: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    parcelCode: string | null;
}

interface StockInFormProps {
    stockIn: StockInRequest;
    onSubmit: (formData: StockInRequest) => void;
    onCancel: () => void;
    title: string;
    initialProductName?: string;
}

const StockInForm: React.FC<StockInFormProps> = ({ stockIn, onSubmit, onCancel, title, initialProductName }) => {
    const [formData, setFormData] = useState<StockInRequest>({ ...stockIn });
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState<string>(initialProductName || "");
    const [selectedProductName, setSelectedProductName] = useState<string>(initialProductName || "");
    const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
    const [showResults, setShowResults] = useState<boolean>(false);
    const productContainerRef = useRef<HTMLDivElement>(null);

    const fetchProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        try {
            const accessToken = getToken();
            if (!accessToken) throw new Error("Không tìm thấy token");

            const response = await fetch("http://localhost:8080/datn/products", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể lấy danh sách sản phẩm");

            const data = await response.json();
            const productsData: Product[] = Array.isArray(data.result) ? data.result : data.result.data || [];
            setProducts(productsData);

            if (initialProductName && !formData.productId) {
                const selectedProduct = productsData.find((p) => p.name === initialProductName);
                if (selectedProduct) {
                    setFormData((prev) => ({ ...prev, productId: selectedProduct.id }));
                    setSelectedProductName(selectedProduct.name);
                    setProductSearch(selectedProduct.name);
                } else {
                    setError("Sản phẩm ban đầu không tồn tại trong danh sách sản phẩm");
                }
            }
        } catch (err: any) {
            console.error("Error fetching products:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách sản phẩm");
        } finally {
            setIsLoadingProducts(false);
        }
    }, [initialProductName, formData.productId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (productContainerRef.current && !productContainerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    const handleInputChange = useCallback((field: keyof StockInRequest, value: string | number | null) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }, []);

    const handleProductSelect = (product: Product) => {
        handleInputChange("productId", product.id);
        setSelectedProductName(product.name);
        setProductSearch(product.name);
        setShowResults(false);
    };

    const validateForm = useCallback(() => {
        if (!formData.productId || formData.productId.trim().length === 0) {
            setError("Vui lòng chọn một sản phẩm");
            return false;
        }
        if (!products.some((p) => p.id === formData.productId)) {
            setError("Sản phẩm không hợp lệ");
            return false;
        }
        if (!formData.quantity || formData.quantity < 1) {
            setError("Số lượng phải lớn hơn 0");
            return false;
        }
        if (formData.unitPrice == null || formData.unitPrice < 0) {
            setError("Đơn giá phải lớn hơn hoặc bằng 0");
            return false;
        }
        return true;
    }, [formData, products]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!validateForm()) return;
            onSubmit(formData);
        },
        [formData, onSubmit, validateForm]
    );

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">{title}</h2>
                {error && (
                    <div className="bg-red-100 text-[#E53E3E] p-2 rounded mb-4 text-sm">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="product"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData.productId ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Sản phẩm <span className="text-[#E53E3E]">*</span>
                        </label>
                        <div className="relative" ref={productContainerRef}>
                            <input
                                type="text"
                                id="product"
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setShowResults(true);
                                    if (!e.target.value) {
                                        handleInputChange("productId", "");
                                        setSelectedProductName("");
                                    }
                                }}
                                onFocus={() => setShowResults(true)}
                                placeholder="Tìm kiếm sản phẩm..."
                                className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                required
                            />
                            {showResults && productSearch && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {isLoadingProducts ? (
                                        <div className="px-3 py-2 text-sm text-[#1A202C]">Đang tải sản phẩm...</div>
                                    ) : filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => handleProductSelect(product)}
                                                className="px-3 py-2 text-sm text-[#1A202C] hover:bg-[#EDF2F7] cursor-pointer transition-all duration-200"
                                            >
                                                {product.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-[#1A202C]">Không tìm thấy sản phẩm</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="quantity"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData.quantity ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Số lượng <span className="text-[#E53E3E]">*</span>
                        </label>
                        <input
                            type="number"
                            id="quantity"
                            value={formData.quantity || ""}
                            onChange={(e) => handleInputChange("quantity", parseInt(e.target.value))}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            min="1"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="unitPrice"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData.unitPrice ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Đơn giá <span className="text-[#E53E3E]">*</span>
                        </label>
                        <input
                            type="number"
                            id="unitPrice"
                            value={formData.unitPrice || ""}
                            onChange={(e) => handleInputChange("unitPrice", parseFloat(e.target.value))}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="parcelCode"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData.parcelCode ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Mã lô hàng
                        </label>
                        <input
                            type="text"
                            id="parcelCode"
                            value={formData.parcelCode || ""}
                            onChange={(e) => handleInputChange("parcelCode", e.target.value || null)}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-300 text-[#1A202C] px-4 py-2 rounded-md hover:bg-gray-400 transition-all duration-200"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200"
                        >
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ManageStockIn: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [stockIns, setStockIns] = useState<StockIn[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedStockIn, setSelectedStockIn] = useState<StockInRequest | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchField, setSearchField] = useState<"productName" | "parcelCode">("productName");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);

    const checkAdmin = async (accessToken: string) => {
        try {
            const response = await fetch("http://localhost:8080/datn/users/myInfo", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể kiểm tra quyền admin");

            const data = await response.json();
            if (data.result?.roles?.some((role: { name: string }) => role.name === "ADMIN")) {
                setIsAdmin(true);
            } else {
                throw new Error("Không có quyền admin");
            }
        } catch (err: any) {
            console.error("Error checking admin status:", err);
            setError(err.message || "Có lỗi xảy ra khi kiểm tra quyền admin");
        }
    };

    const getAllStockIns = async (accessToken: string) => {
        try {
            const response = await fetch("http://localhost:8080/datn/stock-in", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể lấy danh sách nhập kho");

            const data = await response.json();
            const stockInsData: StockIn[] = Array.isArray(data.result) ? data.result : data.result.data || [];
            setStockIns(stockInsData);
        } catch (err: any) {
            console.error("Error fetching stock-ins:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách nhập kho");
        }
    };

    const handleEditStockIn = useCallback((stockIn: StockIn) => {
        setSelectedStockIn({
            id: stockIn.id,
            productId: "", // Will be resolved in StockInForm based on productName
            quantity: stockIn.quantity,
            unitPrice: stockIn.unitPrice,
            parcelCode: stockIn.parcelCode,
        });
        setIsEditModalOpen(true);
    }, []);

    const handleCreateStockIn = useCallback(() => {
        setSelectedStockIn({
            productId: "",
            quantity: 1,
            unitPrice: 0,
            parcelCode: null,
        });
        setIsCreateModalOpen(true);
    }, []);

    const handleDeleteStockIn = async (stockInId: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa phiếu nhập kho này?")) return;
        try {
            const accessToken = getToken();
            if (!accessToken) throw new Error("Không tìm thấy token");

            const response = await fetch(`http://localhost:8080/datn/stock-in/${stockInId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể xóa phiếu nhập kho");
            }

            setStockIns(stockIns.filter((s) => s.id !== stockInId));
            toast.success("Xóa phiếu nhập kho thành công!");
        } catch (err: any) {
            console.error("Error deleting stock-in:", err);
            toast.error(err.message || "Có lỗi xảy ra khi xóa phiếu nhập kho");
        }
    };

    const handleCreateStockInSubmit = async (formData: StockInRequest) => {
        try {
            const accessToken = getToken();
            if (!accessToken) throw new Error("Không tìm thấy token");

            const response = await fetch("http://localhost:8080/datn/stock-in", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId: formData.productId,
                    quantity: formData.quantity,
                    unitPrice: formData.unitPrice,
                    parcelCode: formData.parcelCode,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể tạo phiếu nhập kho");
            }

            const newStockIn = await response.json();
            setStockIns([...stockIns, newStockIn.result || newStockIn]);
            setIsCreateModalOpen(false);
            setSelectedStockIn(null);
            toast.success("Tạo phiếu nhập kho thành công!");
        } catch (err: any) {
            console.error("Error creating stock-in:", err);
            toast.error(err.message || "Có lỗi xảy ra khi tạo phiếu nhập kho");
        }
    };

    const handleUpdateStockIn = async (formData: StockInRequest) => {
        if (!formData.id) {
            toast.error("Không tìm thấy ID phiếu nhập kho để cập nhật");
            return;
        }
        try {
            const accessToken = getToken();
            if (!accessToken) throw new Error("Không tìm thấy token");

            const response = await fetch(`http://localhost:8080/datn/stock-in/${formData.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId: formData.productId,
                    quantity: formData.quantity,
                    unitPrice: formData.unitPrice,
                    parcelCode: formData.parcelCode,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể cập nhật phiếu nhập kho");
            }

            const updatedStockIn = await response.json();
            setStockIns(
                stockIns.map((s) => (s.id === updatedStockIn.result.id ? updatedStockIn.result : s))
            );
            setIsEditModalOpen(false);
            setSelectedStockIn(null);
            toast.success("Cập nhật phiếu nhập kho thành công!");
        } catch (err: any) {
            console.error("Error updating stock-in:", err);
            toast.error(err.message || "Có lỗi xảy ra khi cập nhật phiếu nhập kho");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = getToken();
            if (!accessToken) {
                navigate("/login");
                return;
            }
            await Promise.all([checkAdmin(accessToken), getAllStockIns(accessToken)]);
            setIsLoading(false);
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/");
    }, [isLoading, isAdmin, navigate]);

    const filteredStockIns = stockIns.filter((stockIn) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            searchField === "productName"
                ? (stockIn.productName || "").toLowerCase().includes(searchLower)
                : (stockIn.parcelCode || "").toLowerCase().includes(searchLower);
        return matchesSearch;
    });

    const totalPages = Math.ceil(filteredStockIns.length / itemsPerPage);
    const paginatedStockIns = filteredStockIns.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#EDF2F7]">
                <div className="flex flex-col items-center">
                    <svg
                        className="animate-spin h-8 w-8 text-[#2C5282]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <span className="mt-2 text-[#1A202C]">Đang tải...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-6 text-[#E53E3E] bg-red-100 rounded-lg">{error}</div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-[#EDF2F7]">
            <h1 className="text-2xl font-bold text-[#1A202C] mb-4">Quản lý nhập kho</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={handleCreateStockIn}
                        className="bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200 w-full sm:w-auto"
                    >
                        + Tạo phiếu nhập kho mới
                    </button>
                    <div className="flex flex-col w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder={`Tìm kiếm theo ${searchField === "productName" ? "tên sản phẩm" : "mã lô hàng"
                                }...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                        />
                        <div className="flex space-x-4 mt-2">
                            <label className="flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="searchField"
                                    value="productName"
                                    checked={searchField === "productName"}
                                    onChange={() => setSearchField("productName")}
                                    className="form-radio h-4 w-4 text-[#3182CE]"
                                />
                                <span className="text-sm text-[#1A202C]">Tên sản phẩm</span>
                            </label>
                            <label className="flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="searchField"
                                    value="parcelCode"
                                    checked={searchField === "parcelCode"}
                                    onChange={() => setSearchField("parcelCode")}
                                    className="form-radio h-4 w-4 text-[#3182CE]"
                                />
                                <span className="text-sm text-[#1A202C]">Mã lô hàng</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                <table className="min-w-full border border-gray-200">
                    <thead>
                        <tr className="bg-[#2C5282] text-white text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-16 sm:w-20">STT</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-left">Mã lô hàng</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-left">Tên sản phẩm</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Mã sản phẩm</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Số lượng</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-right">Đơn giá</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-right">Tổng giá</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Ngày lập</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-24 sm:w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: itemsPerPage }).map((_, index) => (
                                <tr key={index}>
                                    <td colSpan={9} className="py-3 px-4">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                </tr>
                            ))
                        ) : paginatedStockIns.length > 0 ? (
                            paginatedStockIns.map((stockIn, index) => (
                                <tr
                                    key={stockIn.id}
                                    className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-[#EDF2F7] transition-all duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-[#1A202C]">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C]">{stockIn.parcelCode || "N/A"}</td>
                                    <td className="py-3 px-4 text-[#1A202C]">{stockIn.productName || "N/A"}</td>
                                    <td className="py-3 px-4 text-center text-[#1A202C]">{stockIn.productCode || "N/A"}</td>
                                    <td className="py-3 px-4 text-center text-[#1A202C]">{stockIn.quantity}</td>
                                    <td className="py-3 px-4 text-right text-[#1A202C]">
                                        {stockIn.unitPrice.toLocaleString("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        })}
                                    </td>
                                    <td className="py-3 px-4 text-right text-[#1A202C]">
                                        {stockIn.totalPrice.toLocaleString("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        })}
                                    </td>
                                    <td className="truncate py-3 px-4 text-center text-[#1A202C]">{stockIn.createdDate}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleEditStockIn(stockIn)}
                                            className="text-[#3182CE] hover:text-[#2C5282] transition-all duration-200 mr-2 sm:mr-4"
                                            title="Chỉnh sửa"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStockIn(stockIn.id)}
                                            className="text-[#E53E3E] hover:text-red-700 transition-all duration-200"
                                            title="Xóa"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                                />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="py-3 px-4 text-center text-[#1A202C]">
                                    Không có phiếu nhập kho
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md ${currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#2C5282] text-white hover:bg-[#3182CE]"
                            } transition-all duration-200`}
                    >
                        Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-md ${currentPage === page
                                ? "bg-[#3182CE] text-white"
                                : "bg-white text-[#1A202C] hover:bg-[#EDF2F7]"
                                } transition-all duration-200`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md ${currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#2C5282] text-white hover:bg-[#3182CE]"
                            } transition-all duration-200`}
                    >
                        Sau
                    </button>
                </div>
            )}

            {isEditModalOpen && selectedStockIn && (
                <StockInForm
                    stockIn={selectedStockIn}
                    onSubmit={handleUpdateStockIn}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa phiếu nhập kho"
                    initialProductName={stockIns.find((s) => s.id === selectedStockIn.id)?.productName || ""}
                />
            )}

            {isCreateModalOpen && selectedStockIn && (
                <StockInForm
                    stockIn={selectedStockIn}
                    onSubmit={handleCreateStockInSubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    title="Tạo phiếu nhập kho mới"
                />
            )}
        </div>
    );
};