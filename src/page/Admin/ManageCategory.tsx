import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { getToken } from "../../services/localStorageService";

interface Category {
    id: number;
    name: string;
    description: string;
}

interface CategoryFormProps {
    category: Category;
    onSubmit: (category: Category) => void;
    onCancel: () => void;
    title: string;
}

const CategoryForm: React.FC<CategoryFormProps> = React.memo(({ category, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState<Category>({ ...category });
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = useCallback((field: keyof Category, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }, []);

    const validateForm = useCallback(() => {
        if (!formData.name || formData.name.trim().length < 2) {
            setError("Tên danh mục phải có ít nhất 2 ký tự");
            return false;
        }
        if (!/^[a-zA-Z0-9\s]+$/.test(formData.name)) {
            setError("Tên danh mục chỉ được chứa chữ cái, số và khoảng trắng");
            return false;
        }
        if (formData.description && formData.description.length > 500) {
            setError("Mô tả không được vượt quá 500 ký tự");
            return false;
        }
        return true;
    }, [formData]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        onSubmit(formData);
    }, [formData, onSubmit, validateForm]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">{title}</h2>
                {error && (
                    <div className="bg-red-100 text-[#E53E3E] p-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { label: "Tên danh mục", name: "name", type: "text", required: true },
                        { label: "Mô tả", name: "description", type: "text", required: false },
                    ].map((field) => (
                        <div key={field.name}>
                            <label
                                htmlFor={field.name}
                                className={`block text-sm font-medium text-[#1A202C] ${formData[field.name as keyof Category] ? 'text-[#2C5282] font-semibold' : ''}`}
                            >
                                {field.label} {field.required && <span className="text-[#E53E3E]">*</span>}
                            </label>
                            <input
                                type={field.type}
                                id={field.name}
                                value={(formData[field.name as keyof Category] as string) || ""}
                                onChange={(e) => handleInputChange(field.name as keyof Category, e.target.value)}
                                className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                required={field.required}
                            />
                        </div>
                    ))}
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
});

export const ManageCategory: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [sortField, setSortField] = useState<keyof Category | "">("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);
    const API_URL = "http://localhost:8080/datn";

    const checkAdmin = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/users/myInfo`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
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
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
            if (!response.ok) throw new Error("Không thể lấy danh sách danh mục");
            const data = await response.json();
            const categoriesData = Array.isArray(data.result) ? data.result : data.result.data || [];
            setCategories(categoriesData);
        } catch (err: any) {
            console.error("Error fetching categories:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách danh mục");
        }
    }, [navigate]);

    const handleEditCategory = useCallback((category: Category) => {
        setSelectedCategory(category);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteCategory = useCallback(async (categoryId: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
        try {
            const accessToken = await getToken();
            if (!accessToken) throw new Error("Access token not found");
            const response = await fetch(`${API_URL}/category/${categoryId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể xóa danh mục");
            }
            setCategories((prev) => prev.filter((c) => c.id !== categoryId));
            setSearchTerm("");
            toast.success("Xóa danh mục thành công!");
        } catch (err: any) {
            console.error("Error deleting category:", err);
            toast.error(err.message || "Có lỗi xảy ra khi xóa danh mục");
        }
    }, [navigate]);

    const handleCreateCategory = useCallback(() => {
        const newCategory: Category = { id: 0, name: "", description: "" };
        setSelectedCategory(newCategory);
        setIsCreateModalOpen(true);
    }, []);

    const handleCreateCategorySubmit = useCallback(async (formData: Category) => {
        try {
            const accessToken = await getToken();
            if (!accessToken) throw new Error("Access token not found");
            const response = await fetch(`${API_URL}/category`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể tạo danh mục");
            }
            const newCategory = await response.json();
            setCategories((prev) => [...prev, newCategory.result || newCategory]);
            setIsCreateModalOpen(false);
            setSelectedCategory(null);
            setSearchTerm("");
            toast.success("Tạo danh mục thành công!");
        } catch (err: any) {
            console.error("Error creating category:", err);
            toast.error(err.message || "Có lỗi xảy ra khi tạo danh mục");
        }
    }, [navigate]);

    const handleUpdateCategory = useCallback(async (formData: Category) => {
        try {
            const accessToken = await getToken();
            if (!accessToken) throw new Error("Access token not found");
            const response = await fetch(`${API_URL}/category/${formData.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể cập nhật danh mục");
            }
            const updatedCategory = await response.json();
            setCategories((prev) =>
                prev.map((c) => (c.id === updatedCategory.result.id ? updatedCategory.result : c))
            );
            setIsEditModalOpen(false);
            setSelectedCategory(null);
            toast.success("Cập nhật danh mục thành công!");
        } catch (err: any) {
            console.error("Error updating category:", err);
            toast.error(err.message || "Có lỗi xảy ra khi cập nhật danh mục");
        }
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = await getToken();
            if (!accessToken) {
                navigate("/login");
                return;
            }
            setIsLoading(true);
            try {
                await Promise.all([checkAdmin(accessToken), getAllCategories(accessToken)]);
            } catch (err: any) {
                setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, checkAdmin, getAllCategories]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/home");
    }, [isLoading, isAdmin, navigate]);

    useEffect(() => {
        setSortDirection('asc');
    }, [sortField]);

    // Filter and sort categories
    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedCategories = [...filteredCategories].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return sortDirection === 'asc'
            ? aValue.toString().localeCompare(bValue.toString())
            : bValue.toString().localeCompare(aValue.toString());
    });

    const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
    const paginatedCategories = sortedCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 bg-[#EDF2F7]">
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                    <table className="w-full border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 text-[#1A202C] text-sm uppercase tracking-wider">
                                <th className="py-3 px-4 border-b text-center w-16 sm:w-20">STT</th>
                                <th className="py-3 px-4 border-b text-center">Tên danh mục</th>
                                <th className="py-3 px-4 border-b text-center">Mô tả</th>
                                <th className="py-3 px-4 border-b text-center w-32">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: itemsPerPage }).map((_, idx) => (
                                <tr key={idx}>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
            <h1 className="text-2xl font-bold text-[#1A202C] mb-4">Quản lý danh mục</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={handleCreateCategory}
                        className="w-full sm:w-auto bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200"
                    >
                        + Tạo danh mục mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 border text-sm border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                    />
                </div>
                <div className="flex flex-col space-y-2">
                    <div>
                        <label className="block text-sm font-medium text-[#1A202C] mb-1">Sắp xếp theo</label>
                        <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value as keyof Category | "")}
                            className="w-full sm:w-48 border text-sm border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                        >
                            <option value="">-- Chọn kiểu sắp xếp --</option>
                            <option value="name">Tên danh mục</option>
                            <option value="description">Mô tả</option>
                        </select>
                    </div>
                    <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="sortDirection"
                                value="asc"
                                checked={sortDirection === 'asc'}
                                onChange={() => setSortDirection('asc')}
                                className="form-radio h-4 w-4 text-[#3182CE] focus:ring-[#3182CE]"
                            />
                            <span className="ml-2 text-sm text-[#1A202C]">Tăng</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="sortDirection"
                                value="desc"
                                checked={sortDirection === 'desc'}
                                onChange={() => setSortDirection('desc')}
                                className="form-radio h-4 w-4 text-[#3182CE] focus:ring-[#3182CE]"
                            />
                            <span className="ml-2 text-sm text-[#1A202C]">Giảm</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="w-full border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100 text-[#1A202C] text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b text-center w-16 sm:w-20">STT</th>
                            <th className="py-3 px-4 border-b text-center">Tên danh mục</th>
                            <th className="py-3 px-4 border-b text-center">Mô tả</th>
                            <th className="py-3 px-4 border-b text-center w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: itemsPerPage }).map((_, idx) => (
                                <tr key={idx}>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                </tr>
                            ))
                        ) : paginatedCategories.length > 0 ? (
                            paginatedCategories.map((category, idx) => (
                                <tr
                                    key={category.id}
                                    className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-[#1A202C]">
                                        {(currentPage - 1) * itemsPerPage + idx + 1}
                                    </td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] truncate">{category.name}</td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] truncate">{category.description}</td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button
                                                onClick={() => handleEditCategory(category)}
                                                className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
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
                                                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-1.5-4.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="text-red-500 hover:text-red-600 transition-colors duration-200"
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
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-3 px-4 text-center text-[#666]">
                                    Không tìm thấy danh mục
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
                        className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors duration-200`}
                    >
                        Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-md text-sm ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-all duration-200 border border-gray-200`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors duration-200`}
                    >
                        Sau
                    </button>
                </div>
            )}

            {isEditModalOpen && selectedCategory && (
                <CategoryForm
                    category={selectedCategory}
                    onSubmit={handleUpdateCategory}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa danh mục"
                />
            )}

            {isCreateModalOpen && selectedCategory && (
                <CategoryForm
                    category={selectedCategory}
                    onSubmit={handleCreateCategorySubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    title="Tạo danh mục mới"
                />
            )}
        </div>
    );
};