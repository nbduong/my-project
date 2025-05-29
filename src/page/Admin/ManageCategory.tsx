import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState<Category>({ ...category });

    const handleInputChange = (field: keyof Category, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {[
                        { label: "Tên danh mục", name: "name", type: "text" },
                        { label: "Mô tả", name: "description", type: "text" },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium">{field.label}</label>
                            <input
                                type={field.type}
                                value={(formData[field.name as keyof Category] as string) || ""}
                                onChange={(e) => handleInputChange(field.name as keyof Category, e.target.value)}
                                className="w-full border px-3 py-2 rounded"
                            />
                        </div>
                    ))}
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
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ManageCategory: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sortField, setSortField] = useState<keyof Category | "">("");
    const [searchTerm, setSearchTerm] = useState("");

    const checkAdmin = async (accessToken: string) => {
        try {
            const response = await fetch("http://localhost:8080/datn/users/myInfo", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

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
            const response = await fetch("http://localhost:8080/datn/category", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể lấy danh sách danh mục");

            const data = await response.json();
            const categoriesData = Array.isArray(data.result) ? data.result : data.result.data || [];
            setCategories(categoriesData);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setError("Có lỗi xảy ra khi tải danh sách danh mục");
        }
    };

    const handleEditCategory = (category: Category) => {
        setSelectedCategory(category);
        setIsEditModalOpen(true);
    };

    const handleDeleteCategory = async (categoryId: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
        try {
            const accessToken = getToken();
            const response = await fetch(`http://localhost:8080/datn/category/${categoryId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể xóa danh mục");
            setCategories(categories.filter((c) => c.id !== categoryId));
            window.location.reload();
        } catch (err) {
            console.error("Error deleting category:", err);
            setError("Có lỗi xảy ra khi xóa danh mục");
        }
    };

    const handleCreateCategory = () => {
        const newCategory: Category = {
            id: 0,
            name: "",
            description: "",
        };
        setSelectedCategory(newCategory);
        setIsCreateModalOpen(true);
    };

    const handleCreateCategorySubmit = async (formData: Category) => {
        try {
            const accessToken = getToken();
            const response = await fetch(`http://localhost:8080/datn/category`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể tạo danh mục");
            }

            const newCategory = await response.json();
            setCategories([...categories, newCategory.result || newCategory]);
            alert("Tạo danh mục thành công!");
            setIsCreateModalOpen(false);
            setSelectedCategory(null);
            window.location.reload();
        } catch (err: any) {
            console.error("Error creating category:", err);
            setError(err.message || "Có lỗi xảy ra khi tạo danh mục");
        }
    };

    const handleUpdateCategory = async (formData: Category) => {
        try {
            const accessToken = getToken();
            const response = await fetch(`http://localhost:8080/datn/category/${formData.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể cập nhật danh mục");
            }

            alert("Cập nhật danh mục thành công!");
            const updatedCategory = await response.json();
            setCategories(categories.map((c) => (c.id === updatedCategory.id ? updatedCategory : c)));
            setIsEditModalOpen(false);
            setSelectedCategory(null);
            window.location.reload();
        } catch (err: any) {
            console.error("Error updating category:", err);
            setError(err.message || "Có lỗi xảy ra khi cập nhật danh mục");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = getToken();
            if (!accessToken) {
                navigate("/login");
                return;
            }
            await Promise.all([checkAdmin(accessToken), getAllCategories(accessToken)]);
            setIsLoading(false);
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/");
    }, [isLoading, isAdmin, navigate]);

    if (isLoading) return <p className="text-center">Đang tải...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedCategories = [...filteredCategories].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return aValue.toString().localeCompare(bValue.toString());
    });

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Quản lý danh mục</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleCreateCategory}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        + Tạo danh mục mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border px-3 py-2 rounded w-64"
                    />
                </div>
                <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as keyof Category)}
                    className="border px-3 py-2 rounded"
                >
                    <option value="">-- Sắp xếp theo --</option>
                    <option value="name">Tên danh mục</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
                    <thead>
                        <tr className="bg-[#371A16] text-white text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b border-gray-200 text-center">ID</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-start">Tên danh mục</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-start">Mô tả</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCategories.length > 0 ? sortedCategories.map((category, index) => (
                            <tr
                                key={category.id}
                                className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors duration-200`}
                            >
                                <td className="py-3 px-4 text-center text-gray-700">{category.id}</td>
                                <td className="py-3 px-4 text-gray-700">{category.name}</td>
                                <td className="py-3 px-4 text-gray-700">{category.description}</td>

                                <td className="py-3 px-4 text-center">
                                    <button
                                        onClick={() => handleEditCategory(category)}
                                        className="text-blue-500 hover:text-blue-700 transition-colors duration-200 mr-4"
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
                                        onClick={() => handleDeleteCategory(category.id)}
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
                        )) : (
                            <tr>
                                <td colSpan={4} className="py-3 px-4 text-center text-gray-500">
                                    Không có danh mục
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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