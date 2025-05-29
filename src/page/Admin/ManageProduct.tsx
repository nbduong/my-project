import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

    const handleInputChange = (field: keyof Product, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSpecChange = (index: number, field: "key" | "value", value: string) => {
        setSpecFields((prev) => {
            const newFields = [...prev];
            newFields[index] = { ...newFields[index], [field]: value };
            return newFields;
        });
    };

    const addSpecField = () => {
        setSpecFields((prev) => [...prev, { key: "", value: "" }]);
    };

    const removeSpecField = (index: number) => {
        setSpecFields((prev) => prev.filter((_, i) => i !== index));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedImages(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBrandId || !selectedCategoryId) {
            alert("Vui lòng chọn thương hiệu và danh mục!");
            return;
        }
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
                brandId: selectedBrandId,
                categoryId: selectedCategoryId,
                specificationsJson,
            };
            await onSubmit(updatedFormData, selectedImages);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded w-full max-w-lg sm:max-w-md md:max-w-lg">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {[
                        { label: "Mã sản phẩm", name: "productCode", type: "text" },
                        { label: "Tên sản phẩm", name: "name", type: "text" },
                        { label: "Giá", name: "price", type: "number" },
                        { label: "Số lượng", name: "quantity", type: "number" },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium">{field.label}</label>
                            <input
                                type={field.type}
                                value={(formData[field.name as keyof Product] as string | number) || ""}
                                onChange={(e) =>
                                    handleInputChange(
                                        field.name as keyof Product,
                                        field.type === "number" ? Number(e.target.value) : e.target.value
                                    )
                                }
                                className="w-full border px-3 py-2 rounded"
                            />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium">Mô tả</label>
                        <textarea
                            value={formData.description || ""}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            className="w-full border px-3 py-2 rounded h-32 resize-y"
                            placeholder="Nhập mô tả sản phẩm..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Chọn danh mục</label>
                        <select
                            value={selectedCategoryId || ""}
                            onChange={(e) => {
                                const categoryId = Number(e.target.value);
                                setSelectedCategoryId(categoryId);
                                const category = categories.find((cat) => cat.id === categoryId);
                                handleInputChange("categoryName", category?.name || "");
                            }}
                            className="w-full border px-3 py-2 rounded"
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
                        <label className="block text-sm font-medium">Chọn thương hiệu</label>
                        <select
                            value={selectedBrandId || ""}
                            onChange={(e) => {
                                const brandId = Number(e.target.value);
                                setSelectedBrandId(brandId);
                                const brand = brands.find((b) => b.id === brandId);
                                handleInputChange("brandName", brand?.name || "");
                            }}
                            className="w-full border px-3 py-2 rounded"
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
                        <label className="block text-sm font-medium mb-2">Thông số kỹ thuật</label>
                        {specFields.map((spec, index) => (
                            <div key={index} className="flex space-x-2 mb-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Tên thông số (key)"
                                    value={spec.key}
                                    onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                                    className="w-1/2 border px-3 py-2 rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Giá trị (value)"
                                    value={spec.value}
                                    onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                                    className="w-1/2 border px-3 py-2 rounded"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSpecField(index)}
                                    className="text-red-500 hover:text-red-700"
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
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mt-2"
                        >
                            + Thêm thông số
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Chọn ảnh</label>
                        <input
                            type="file"
                            multiple
                            onChange={handleImageChange}
                            className="w-full border px-3 py-2 rounded"
                        />
                        {selectedImages.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                                Đã chọn {selectedImages.length} ảnh
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-400 text-white px-4 py-2 rounded"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`bg-blue-600 text-white px-4 py-2 rounded ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            {isSubmitting ? "Đang lưu..." : "Lưu"}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded w-full max-w-lg sm:max-w-md md:max-w-lg">
                <h2 className="text-xl font-bold mb-4">Xem chi tiết sản phẩm</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Mã sản phẩm</label>
                        <p className="border px-3 py-2 rounded">{product.productCode}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tên sản phẩm</label>
                        <p className="border px-3 py-2 rounded">{product.name}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Thương hiệu</label>
                        <p className="border px-3 py-2 rounded">{product.brandName}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Mô tả</label>
                        <p className="border px-3 py-2 rounded h-32 overflow-y-auto">
                            {product.description || "Không có mô tả"}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Ảnh</label>
                        {product.images.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
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
                            <p className="text-gray-400">Không có ảnh</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Giá</label>
                        <p className="border px-3 py-2 rounded">{product.price.toLocaleString()} VNĐ</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Số lượng</label>
                        <p className="border px-3 py-2 rounded">{product.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Danh mục</label>
                        <p className="border px-3 py-2 rounded">{product.categoryName || "Không có danh mục"}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Thông số kỹ thuật</label>
                        <div className="border px-3 py-2 rounded">
                            {Object.entries(product.specifications).map(([key, value]) => (
                                <p key={key} className="text-sm">
                                    <span className="font-medium">{key}:</span> {value}
                                </p>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-gray-400 text-white px-4 py-2 rounded"
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
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setbrands] = useState<Brand[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [sortField, setSortField] = useState<keyof Product | "">("");
    const [searchTerm, setSearchTerm] = useState("");
    const API_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL
        : 'http://localhost:8080/datn';

    const checkAdmin = async (accessToken: string) => {
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
            if (data.result.roles?.some((role: { name: string }) => role.name === "ADMIN")) {
                setIsAdmin(true);
            }
        } catch (err) {
            console.error("Error checking admin status:", err);
            setError("Có lỗi xảy ra khi kiểm tra quyền admin");
        }
    };

    const getAllCategories = async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/category`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error("Không thể lấy danh sách danh mục");
            const data = await response.json();
            const categoriesData = Array.isArray(data.result) ? data.result : data.result?.data || [];
            setCategories(categoriesData);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setError("Có lỗi xảy ra khi tải danh sách danh mục");
        }
    };

    const getAllbrands = async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/brand`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error("Không thể lấy danh sách thương hiệu");
            const data = await response.json();
            const brandData = Array.isArray(data.result) ? data.result : data.result?.data || [];
            setbrands(brandData);
        } catch (err) {
            console.error("Error fetching brand:", err);
            setError("Có lỗi xảy ra khi tải danh sách thương hiệu");
        }
    };

    const getAllProducts = async (accessToken: string) => {
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
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Có lỗi xảy ra khi tải danh sách sản phẩm");
        }
    };

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const handleDeleteProduct = async (productId: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        const previousProducts = [...products];
        setProducts(products.filter((p) => p.id !== productId));
        try {
            const accessToken = getToken();
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập hết hạn");
            }
            if (!response.ok) throw new Error("Không thể xóa sản phẩm");
        } catch (err) {
            setProducts(previousProducts);
            setError("Có lỗi xảy ra khi xóa sản phẩm");
        }
    };

    const handleCreateProduct = () => {
        const newProduct: Product = {
            id: 0,
            name: "",
            productCode: "",
            description: null,
            price: 0,
            quantity: 0,
            brandName: "",
            categoryName: "",
            images: [],
            specifications: {},
        };
        setSelectedProduct(newProduct);
        setIsCreateModalOpen(true);
    };

    const handleCreateProductSubmit = async (formData: ProductFormData, images: File[]) => {
        try {
            const accessToken = getToken();
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name || "");
            formDataToSend.append("productCode", formData.productCode || "");
            formDataToSend.append("description", formData.description || "");
            formDataToSend.append("price", formData.price.toString());
            formDataToSend.append("quantity", formData.quantity.toString());
            formDataToSend.append("brandId", formData.brandId.toString());
            formDataToSend.append("categoryId", formData.categoryId.toString());
            formDataToSend.append("specificationsJson", JSON.stringify(formData.specificationsJson)); // Đảm bảo tên trường khớp
            formDataToSend.append("status", "1");
            formDataToSend.append("viewCount", "0");
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
            alert("Tạo sản phẩm thành công!");
            setIsCreateModalOpen(false);
            setSelectedProduct(null);
            window.location.reload();
        } catch (err: any) {
            setError(err.message || "Có lỗi xảy ra khi tạo sản phẩm");
            console.error("Error details:", err); // Thêm log để debug
        }
    };

    const handleUpdateProduct = async (formData: ProductFormData, images: File[]) => {
        try {
            const accessToken = getToken();
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name || "");
            formDataToSend.append("productCode", formData.productCode || "");
            formDataToSend.append("description", formData.description || "");
            formDataToSend.append("price", formData.price.toString());
            formDataToSend.append("quantity", formData.quantity.toString());
            formDataToSend.append("brandId", formData.brandId.toString());
            formDataToSend.append("categoryId", formData.categoryId.toString());
            formDataToSend.append("specificationsJson", JSON.stringify(formData.specificationsJson));
            formDataToSend.append("status", "1"); // Thêm trường status nếu bắt buộc
            images.forEach((image) => formDataToSend.append("images", image));

            const response = await fetch(`${API_URL}/products/${selectedProduct?.id}`, {
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
                prev.map((p) => (p.id === updatedProduct.id ? updatedProduct.result || updatedProduct : p))
            );
            alert("Cập nhật sản phẩm thành công!");
            setIsEditModalOpen(false);
            setSelectedProduct(null);
            window.location.reload();

        } catch (err: any) {
            setError(err.message || "Có lỗi xảy ra khi cập nhật sản phẩm");
            console.error("Error details:", err);
        }
    };

    const handleViewProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsViewModalOpen(true);
    };

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
                getAllbrands(accessToken),
            ]);
            setIsLoading(false);
        };
        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/");
    }, [isLoading, isAdmin, navigate]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    if (isLoading) return <p className="text-center">Đang tải...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

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
            return (a[sortField] as number) - (b[sortField] as number);
        }
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return aValue.toString().localeCompare(bValue.toString());
    });

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Quản lý sản phẩm</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleCreateProduct}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        + Tạo sản phẩm mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border px-3 py-2 rounded w-64"
                    />
                </div>
                <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as keyof Product)}
                    className="border px-3 py-2 rounded"
                >
                    <option value="">-- Sắp xếp theo --</option>
                    <option value="productCode">Mã sản phẩm</option>
                    <option value="name">Tên sản phẩm</option>
                    <option value="brandName">Thương hiệu</option>
                    <option value="price">Giá</option>
                    <option value="quantity">Số lượng</option>
                    <option value="categoryName">Danh mục</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
                    <thead>
                        <tr className="bg-[#371A16] text-white text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden sm:table-cell">ID</th>
                            {/* <th className="py-3 px-4 border-b border-gray-200 text-center">Ảnh</th> */}
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Mã sản phẩm</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Tên sản phẩm</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden md:table-cell">Thương hiệu</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden md:table-cell">Số lượng</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden md:table-cell">Giá</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden lg:table-cell">Danh mục</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedProducts.length > 0 ? (
                            sortedProducts.map((product, index) => (
                                <tr
                                    key={product.id}
                                    className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-gray-100 transition-colors duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-gray-700 hidden sm:table-cell">{product.id}</td>
                                    {/* <td className="py-3 px-4 text-center w-48 h-32">
                                        {product.images[0] ? (
                                            <img
                                                src={`${API_URL}/${product.images[0]}`}
                                                alt={`${product.name} thumbnail`}
                                                className="w-32 h-32 object-cover rounded-md mx-auto border border-gray-200"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/avatar.png";
                                                }}
                                            />
                                        ) : (
                                            <span className="text-gray-400">Không có ảnh</span>
                                        )}
                                    </td> */}
                                    <td className="py-3 px-4 text-gray-700 text-center">{product.productCode}</td>
                                    <td className="py-3 px-4 text-gray-700 text-center">{product.name}</td>
                                    <td className="py-3 px-4 text-gray-700 text-center hidden md:table-cell">{product.brandName}</td>
                                    <td className="py-3 px-4 text-gray-700 text-center hidden md:table-cell">
                                        {product.quantity.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-gray-700 text-center hidden md:table-cell">
                                        {product.price.toLocaleString()} VNĐ
                                    </td>
                                    <td className="py-3 px-4 text-gray-700 text-center hidden lg:table-cell">
                                        {product.categoryName || "Không có danh mục"}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleViewProduct(product)}
                                            className="text-green-500 hover:text-green-700 transition-colors duration-200 mr-2"
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
                                            className="text-blue-500 hover:text-blue-700 transition-colors duration-200 mr-2"
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
                                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
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
                                <td colSpan={8} className="py-3 px-4 text-center text-gray-500">
                                    Không có sản phẩm
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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