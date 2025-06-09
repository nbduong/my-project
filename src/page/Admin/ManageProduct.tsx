import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { getToken } from "../../services/localStorageService";

// Interface cho danh mục và thương hiệu
interface Category {
    id: number;
    name: string;
    description: string;
}

interface Brand {
    id: number;
    name: string;
}

// Interface cho sản phẩm
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
    isDeleted: boolean;
}

// Interface cho dữ liệu gửi về backend
interface ProductFormData {
    name: string;
    productCode: string;
    description: string | null;
    price: number;
    quantity: number;
    brandId: number;
    categoryId: number;
    specificationsJson: { [key: string]: string };
    isDeleted: boolean;
}

interface ProductFormProps {
    product: Product;
    categories: Category[];
    brands: Brand[];
    onSubmit: (product: ProductFormData, images: File[]) => void;
    onCancel: () => void;
    title: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, categories, brands, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState<Product>({ ...product });
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [specFields, setSpecFields] = useState<{ key: string; value: string }[]>(
        Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
    );
    const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>(
        brands.find((brand) => brand.name === product.brandName)?.id
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
        categories.find((category) => category.name === product.categoryName)?.id
    );
    const [error, setError] = useState<string | null>(null);

    const validateForm = useCallback(() => {
        if (!formData.name || formData.name.trim().length < 2) {
            setError("Tên sản phẩm phải có ít nhất 2 ký tự");
            return false;
        }
        if (!formData.productCode || formData.productCode.trim().length < 3) {
            setError("Mã sản phẩm phải có ít nhất 3 ký tự");
            return false;
        }
        if (formData.price <= 0) {
            setError("Giá sản phẩm phải lớn hơn 0");
            return false;
        }
        if (formData.quantity < 0) {
            setError("Số lượng sản phẩm không được âm");
            return false;
        }
        if (!selectedBrandId) {
            setError("Vui lòng chọn thương hiệu");
            return false;
        }
        if (!selectedCategoryId) {
            setError("Vui lòng chọn danh mục");
            return false;
        }
        if (formData.description && formData.description.length > 1000) {
            setError("Mô tả không được vượt quá 1000 ký tự");
            return false;
        }
        if (specFields.some((spec) => spec.key && !spec.value)) {
            setError("Vui lòng nhập giá trị cho tất cả thông số kỹ thuật");
            return false;
        }
        return true;
    }, [formData, selectedBrandId, selectedCategoryId, specFields]);

    const handleInputChange = useCallback((field: keyof Product, value: string | number | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }, []);

    const handleSpecChange = useCallback((index: number, field: "key" | "value", value: string) => {
        setSpecFields((prev) => {
            const newFields = [...prev];
            newFields[index] = { ...newFields[index], [field]: value };
            return newFields;
        });
        setError(null);
    }, []);

    const addSpecField = useCallback(() => {
        setSpecFields((prev) => [...prev, { key: "", value: "" }]);
    }, []);

    const removeSpecField = useCallback((index: number) => {
        setSpecFields((prev) => prev.filter((_, i) => i !== index));
        setError(null);
    }, []);

    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedImages(Array.from(e.target.files));
            setError(null);
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            const specificationsJson: { [key: string]: string } = {};
            specFields.forEach(({ key, value }) => {
                if (key && value) {
                    specificationsJson[key] = value;
                }
            });
            const updatedFormData: ProductFormData = {
                name: formData.name,
                productCode: formData.productCode,
                description: formData.description,
                price: formData.price,
                quantity: formData.quantity,
                brandId: selectedBrandId!,
                categoryId: selectedCategoryId!,
                specificationsJson,
                isDeleted: formData.isDeleted,
            };
            await onSubmit(updatedFormData, selectedImages);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, selectedBrandId, selectedCategoryId, specFields, selectedImages, onSubmit, validateForm]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">{title}</h2>
                {error && (
                    <div className="bg-red-100 text-[#E53E3E] p-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { label: "Mã sản phẩm", name: "productCode", type: "text", required: true },
                        { label: "Tên sản phẩm", name: "name", type: "text", required: true },
                        { label: "Giá", name: "price", type: "number", required: true },
                        { label: "Số lượng", name: "quantity", type: "number", required: true },
                    ].map((field) => (
                        <div key={field.name}>
                            <label
                                htmlFor={field.name}
                                className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData[field.name as keyof Product] ? "text-[#2C5282] font-semibold" : ""
                                    }`}
                            >
                                {field.label} {field.required && <span className="text-[#E53E3E]">*</span>}
                            </label>
                            <input
                                type={field.type}
                                id={field.name}
                                value={(formData[field.name as keyof Product] as string | number) || ""}
                                onChange={(e) =>
                                    handleInputChange(
                                        field.name as keyof Product,
                                        field.type === "number" ? Number(e.target.value) : e.target.value
                                    )
                                }
                                className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                required={field.required}
                            />
                        </div>
                    ))}
                    <div>
                        <label
                            htmlFor="description"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData.description ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Mô tả
                        </label>
                        <textarea
                            id="description"
                            value={formData.description || ""}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200 h-32 resize-y"
                            placeholder="Nhập mô tả sản phẩm..."
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="categoryId"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${selectedCategoryId ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Chọn danh mục <span className="text-[#E53E3E]">*</span>
                        </label>
                        <select
                            id="categoryId"
                            value={selectedCategoryId || ""}
                            onChange={(e) => {
                                const categoryId = Number(e.target.value);
                                setSelectedCategoryId(categoryId);
                                const category = categories.find((cat) => cat.id === categoryId);
                                handleInputChange("categoryName", category?.name || "");
                            }}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
                        >
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor="brandId"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${selectedBrandId ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Chọn thương hiệu <span className="text-[#E53E3E]">*</span>
                        </label>
                        <select
                            id="brandId"
                            value={selectedBrandId || ""}
                            onChange={(e) => {
                                const brandId = Number(e.target.value);
                                setSelectedBrandId(brandId);
                                const brand = brands.find((b) => b.id === brandId);
                                handleInputChange("brandName", brand?.name || "");
                            }}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
                        >
                            <option value="">-- Chọn thương hiệu --</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1A202C] mb-2">Trạng thái</label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isDeleted}
                                onChange={(e) => handleInputChange("isDeleted", e.target.checked)}
                                className="form-checkbox h-5 w-5 text-[#3182CE] focus:ring-[#3182CE]"
                            />
                            <span className="ml-2 text-sm text-[#1A202C]">Đã xóa</span>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1A202C] mb-2">Thông số kỹ thuật</label>
                        {specFields.map((spec, index) => (
                            <div key={index} className="flex space-x-2 mb-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Tên thông số (key)"
                                    value={spec.key}
                                    onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                                    className="w-1/2 mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                />
                                <input
                                    type="text"
                                    placeholder="Giá trị (value)"
                                    value={spec.value}
                                    onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                                    className="w-1/2 mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSpecField(index)}
                                    className="text-[#E53E3E] hover:text-red-700 transition-colors duration-200"
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addSpecField}
                            className="bg-[#2C5282] text-white px-3 py-1 rounded-md hover:bg-[#3182CE] transition-all duration-200 mt-2"
                        >
                            + Thêm thông số
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1A202C]">Chọn ảnh</label>
                        <input
                            type="file"
                            multiple
                            onChange={handleImageChange}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                        />
                        {selectedImages.length > 0 && (
                            <p className="text-sm text-[#1A202C] mt-1">
                                Đã chọn {selectedImages.length} ảnh
                            </p>
                        )}
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
                            disabled={isSubmitting}
                            className={`bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ViewProductModal: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
    const API_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL
        : 'http://localhost:8080/datn';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">Xem chi tiết sản phẩm</h2>
                <div className="space-y-4">
                    {[
                        { label: "Mã sản phẩm", value: product.productCode },
                        { label: "Tên sản phẩm", value: product.name },
                        { label: "Thương hiệu", value: product.brandName },
                        { label: "Danh mục", value: product.categoryName || "Không có danh mục" },
                        { label: "Giá", value: `${product.price.toLocaleString()} VNĐ` },
                        { label: "Số lượng", value: product.quantity.toLocaleString() },
                        { label: "Trạng thái", value: product.isDeleted ? "Đã xóa" : "Hoạt động" },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <label className="block text-sm font-medium text-[#2C5282]">{label}</label>
                            <p className="mt-1 px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 text-[#1A202C]">
                                {value}
                            </p>
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-[#2C5282]">Mô tả</label>
                        <p className="mt-1 px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 text-[#1A202C] h-32 overflow-y-auto">
                            {product.description || "Không có mô tả"}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#2C5282]">Ảnh</label>
                        {product.images.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4 mt-1">
                                {product.images.map((image, index) => (
                                    <img
                                        key={index}
                                        src={`${API_URL}/${image}`}
                                        alt={`${product.name} image ${index + 1}`}
                                        className="w-32 h-32 object-cover rounded-md border border-gray-200"
                                        onError={(e) => {
                                            e.currentTarget.src = "/avatar.png";
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-[#1A202C] mt-1">Không có ảnh</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#2C5282]">Thông số kỹ thuật</label>
                        <div className="mt-1 px-3 py-2 rounded-md border border-gray-300 bg-gray-50">
                            {Object.entries(product.specifications).length > 0 ? (
                                Object.entries(product.specifications).map(([key, value]) => (
                                    <p key={key} className="text-sm text-[#1A202C]">
                                        <span className="font-medium">{key}:</span> {value}
                                    </p>
                                ))
                            ) : (
                                <p className="text-[#1A202C]">Không có thông số</p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-gray-300 text-[#1A202C] px-4 py-2 rounded-md hover:bg-gray-400 transition-all duration-200"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ManageProduct: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [sortField, setSortField] = useState<keyof Product | "">("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);
    const API_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL
        : 'http://localhost:8080/datn';

    const checkAdmin = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/users/myInfo`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập hết hạn");
            }
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
    }, [navigate]);

    const getAllCategories = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/category`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error("Không thể lấy danh sách danh mục");
            const data = await response.json();
            const categoriesData = Array.isArray(data.result) ? data.result : data.result?.data || [];
            setCategories(categoriesData);
        } catch (err: any) {
            console.error("Error fetching categories:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách danh mục");
        }
    }, []);

    const getAllBrands = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/brand`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error("Không thể lấy danh sách thương hiệu");
            const data = await response.json();
            const brandData = Array.isArray(data.result) ? data.result : data.result?.data || [];
            setBrands(brandData);
        } catch (err: any) {
            console.error("Error fetching brands:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách thương hiệu");
        }
    }, []);

    const getAllProducts = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập hết hạn");
            }
            if (!response.ok) throw new Error("Không thể lấy danh sách sản phẩm");
            const data = await response.json();
            const productsData = Array.isArray(data.result) ? data.result : data.result?.data || [];
            if (!Array.isArray(productsData)) throw new Error("Dữ liệu sản phẩm không hợp lệ");
            setProducts(productsData);
        } catch (err: any) {
            console.error("Error fetching products:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách sản phẩm");
        }
    }, [navigate]);

    const handleEditProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteProduct = useCallback(async (productId: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            const accessToken = getToken();
            if (!accessToken) throw new Error("Không tìm thấy token");
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập hết hạn");
            }
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể xóa sản phẩm");
            }
            setProducts((prev) => prev.filter((p) => p.id !== productId));
            setSearchTerm("");
            toast.success("Xóa sản phẩm thành công!");
        } catch (err: any) {
            console.error("Error deleting product:", err);
            toast.error(err.message || "Có lỗi xảy ra khi xóa sản phẩm");
        }
    }, [navigate]);

    const handleCreateProduct = useCallback(() => {
        const newProduct: Product = {
            id: "",
            name: "",
            productCode: "",
            description: null,
            price: 0,
            quantity: 0,
            brandName: "",
            categoryName: "",
            images: [],
            specifications: {},
            isDeleted: false,
        };
        setSelectedProduct(newProduct);
        setIsCreateModalOpen(true);
    }, []);

    const handleCreateProductSubmit = useCallback(async (formData: ProductFormData, images: File[]) => {
        try {
            const accessToken = getToken();
            if (!accessToken) throw new Error("Không tìm thấy token");
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name || "");
            formDataToSend.append("productCode", formData.productCode || "");
            formDataToSend.append("description", formData.description || "");
            formDataToSend.append("price", formData.price.toString());
            formDataToSend.append("quantity", formData.quantity.toString());
            formDataToSend.append("brandId", formData.brandId.toString());
            formDataToSend.append("categoryId", formData.categoryId.toString());
            formDataToSend.append("specificationsJson", JSON.stringify(formData.specificationsJson));
            formDataToSend.append("status", "1");
            formDataToSend.append("viewCount", "0");
            formDataToSend.append("isDeleted", formData.isDeleted.toString());
            images.forEach((image) => formDataToSend.append("images", image));

            const response = await fetch(`${API_URL}/products`, {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formDataToSend,
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập hết hạn");
            }
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể tạo sản phẩm");
            }
            const newProduct = await response.json();
            setProducts((prev) => [...prev, newProduct.result || newProduct]);
            setIsCreateModalOpen(false);
            setSelectedProduct(null);
            toast.success("Tạo sản phẩm thành công!");
        } catch (err: any) {
            console.error("Error creating product:", err);
            toast.error(err.message || "Có lỗi xảy ra khi tạo sản phẩm");
        }
    }, [navigate]);

    const handleUpdateProduct = useCallback(async (formData: ProductFormData, images: File[]) => {
        if (!selectedProduct) return;
        try {
            const accessToken = getToken();
            if (!accessToken) throw new Error("Không tìm thấy token");
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name || "");
            formDataToSend.append("productCode", formData.productCode || "");
            formDataToSend.append("description", formData.description || "");
            formDataToSend.append("price", formData.price.toString());
            formDataToSend.append("quantity", formData.quantity.toString());
            formDataToSend.append("brandId", formData.brandId.toString());
            formDataToSend.append("categoryId", formData.categoryId.toString());
            formDataToSend.append("specificationsJson", JSON.stringify(formData.specificationsJson));
            formDataToSend.append("status", "1");
            formDataToSend.append("isDeleted", formData.isDeleted.toString());
            images.forEach((image) => formDataToSend.append("images", image));

            const response = await fetch(`${API_URL}/products/${selectedProduct.id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formDataToSend,
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập hết hạn");
            }
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể cập nhật sản phẩm");
            }
            const updatedProduct = await response.json();
            setProducts((prev) =>
                prev.map((p) => (p.id === updatedProduct.result?.id ? updatedProduct.result : p))
            );
            setIsEditModalOpen(false);
            setSelectedProduct(null);
            toast.success("Cập nhật sản phẩm thành công!");
        } catch (err: any) {
            console.error("Error updating product:", err);
            toast.error(err.message || "Có lỗi xảy ra khi cập nhật sản phẩm");
        }
    }, [selectedProduct, navigate]);

    const handleViewProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsViewModalOpen(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = getToken();
            if (!accessToken) {
                navigate("/login");
                return;
            }
            await Promise.all([
                checkAdmin(accessToken),
                getAllProducts(accessToken),
                getAllCategories(accessToken),
                getAllBrands(accessToken),
            ]);
            setIsLoading(false);
        };
        fetchData();
    }, [navigate, checkAdmin, getAllProducts, getAllCategories, getAllBrands]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/");
    }, [isLoading, isAdmin, navigate]);

    // Pagination logic
    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortField) return 0;
        if (sortField === "price" || sortField === "quantity") {
            return sortDirection === "asc"
                ? (a[sortField] as number) - (b[sortField] as number)
                : (b[sortField] as number) - (a[sortField] as number);
        }
        if (sortField === "isDeleted") {
            return sortDirection === "asc"
                ? Number(a.isDeleted) - Number(b.isDeleted)
                : Number(b.isDeleted) - Number(a.isDeleted);
        }
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return sortDirection === "asc"
            ? aValue.toString().localeCompare(bValue.toString())
            : bValue.toString().localeCompare(aValue.toString());
    });

    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

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
            <div className="text-center p-6 text-[#E53E3E] bg-red-100 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-[#EDF2F7]">
            <h1 className="text-2xl font-bold text-[#1A202C] mb-4">Quản lý sản phẩm</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={handleCreateProduct}
                        className="bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200"
                    >
                        + Tạo sản phẩm mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                    />
                </div>
                <select
                    value={sortField}
                    onChange={(e) => {
                        setSortField(e.target.value as keyof Product);
                        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                    }}
                    className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200 w-full sm:w-auto"
                >
                    <option value="">-- Sắp xếp theo --</option>
                    <option value="productCode">Mã sản phẩm {sortDirection === "asc" ? "↑" : "↓"}</option>
                    <option value="name">Tên sản phẩm {sortDirection === "asc" ? "↑" : "↓"}</option>
                    <option value="price">Giá {sortDirection === "asc" ? "↑" : "↓"}</option>
                    <option value="quantity">Số lượng {sortDirection === "asc" ? "↑" : "↓"}</option>
                    <option value="categoryName">Danh mục {sortDirection === "asc" ? "↑" : "↓"}</option>
                    <option value="isDeleted">Trạng thái {sortDirection === "asc" ? "↑" : "↓"}</option>
                </select>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                <table className="min-w-full border border-gray-200">
                    <thead>
                        <tr className="bg-[#2C5282] text-white text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-16 sm:w-20">STT</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Mã sản phẩm</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Tên sản phẩm</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden md:table-cell">Trạng thái</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden md:table-cell">Số lượng</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden md:table-cell">Giá</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden lg:table-cell">Danh mục</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-24 sm:w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: itemsPerPage }).map((_, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4 hidden md:table-cell"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4 hidden md:table-cell"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4 hidden md:table-cell"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4 hidden lg:table-cell"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                </tr>
                            ))
                        ) : paginatedProducts.length > 0 ? (
                            paginatedProducts.map((product, index) => (
                                <tr
                                    key={product.id}
                                    className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-[#EDF2F7] transition-colors duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-[#1A202C]">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center truncate">{product.productCode}</td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center truncate">{product.name}</td>
                                    <td className="py-3 px-4 text-center hidden md:table-cell">
                                        <span
                                            className={`inline-block w-3 h-3 rounded-full ${product.isDeleted ? "bg-[#E53E3E]" : "bg-[#38A169]"}`}
                                        ></span>
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center hidden md:table-cell">
                                        {product.quantity.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center hidden md:table-cell">
                                        {product.price.toLocaleString()} VNĐ
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center hidden lg:table-cell truncate">
                                        {product.categoryName || "Không có danh mục"}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleViewProduct(product)}
                                            className="text-[#38A169] hover:text-[#2F855A] transition-colors duration-200 mr-2 sm:mr-4"
                                            title="Xem chi tiết"
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
                                                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleEditProduct(product)}
                                            className="text-[#3182CE] hover:text-[#2C5282] transition-colors duration-200 mr-2 sm:mr-4"
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
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="text-[#E53E3E] hover:text-red-700 transition-colors duration-200"
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
                                <td colSpan={8} className="py-3 px-4 text-center text-[#1A202C]">
                                    Không có sản phẩm
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

            {isEditModalOpen && selectedProduct && (
                <ProductForm
                    product={selectedProduct}
                    categories={categories}
                    brands={brands}
                    onSubmit={handleUpdateProduct}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa sản phẩm"
                />
            )}

            {isCreateModalOpen && selectedProduct && (
                <ProductForm
                    product={selectedProduct}
                    categories={categories}
                    brands={brands}
                    onSubmit={handleCreateProductSubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    title="Tạo sản phẩm mới"
                />
            )}

            {isViewModalOpen && selectedProduct && (
                <ViewProductModal product={selectedProduct} onClose={() => setIsViewModalOpen(false)} />
            )}
        </div>
    );
};