import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../services/localStorageService";

interface Brand {
    id: number;
    name: string;
}

interface BrandFormProps {
    brand: Brand;
    onSubmit: (brand: Brand) => void;
    onCancel: () => void;
    title: string;
}

const BrandForm: React.FC<BrandFormProps> = ({ brand, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState<Brand>({ ...brand });
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (field: keyof Brand, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateForm = () => {
        if (!formData.name || formData.name.trim().length < 2) {
            setError("Tên thương hiệu phải có ít nhất 2 ký tự");
            return false;
        }
        if (!/^[a-zA-Z0-9\s]+$/.test(formData.name)) {
            setError("Tên thương hiệu chỉ được chứa chữ cái, số và khoảng trắng");
            return false;
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg shadow-xl">
                <h2
                    className="text-xl font-bold text-[#1A202C] mb-4"
                >
                    {title}
                </h2>
                {error && (
                    <div className="bg-red-100 text-[#E53E3E] p-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData.name ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Tên thương hiệu <span className="text-[#E53E3E]">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name || ""}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
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

export const ManageBrand: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [sortField, setSortField] = useState<keyof Brand | "">("");
    const [searchTerm, setSearchTerm] = useState<string>("");
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

    const getAllBrands = async (accessToken: string) => {
        try {
            const response = await fetch("http://localhost:8080/datn/brand", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể lấy danh sách thương hiệu");

            const data = await response.json();
            const brandsData: Brand[] = Array.isArray(data.result) ? data.result : data.result.data || [];
            setBrands(brandsData);
        } catch (err: any) {
            console.error("Error fetching brands:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách thương hiệu");
        }
    };

    const handleEditBrand = (brand: Brand) => {
        setSelectedBrand(brand);
        setIsEditModalOpen(true);
    };

    const handleDeleteBrand = async (brandId: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa thương hiệu này?")) return;
        try {
            const accessToken = getToken();
            const response = await fetch(`http://localhost:8080/datn/brand/${brandId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể xóa thương hiệu");
            }

            setBrands(brands.filter((b) => b.id !== brandId));
            setError(null);
        } catch (err: any) {
            console.error("Error deleting brand:", err);
            setError(err.message || "Có lỗi xảy ra khi xóa thương hiệu");
        }
    };

    const handleCreateBrandSubmit = async (formData: Brand) => {
        try {
            const accessToken = getToken();
            const response = await fetch(`http://localhost:8080/datn/brand`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể tạo thương hiệu");
            }

            const newBrand = await response.json();
            setBrands([...brands, newBrand.result || newBrand]);
            setIsCreateModalOpen(false);
            setSelectedBrand(null);
            setError(null);
        } catch (err: any) {
            console.error("Error creating brand:", err);
            setError(err.message || "Có lỗi xảy ra khi tạo thương hiệu");
        }
    };

    const handleUpdateBrand = async (formData: Brand) => {
        try {
            const accessToken = getToken();
            const response = await fetch(`http://localhost:8080/datn/brand/${formData.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể cập nhật thương hiệu");
            }

            const updatedBrand = await response.json();
            setBrands(brands.map((b) => (b.id === updatedBrand.result.id ? updatedBrand.result : b)));
            setIsEditModalOpen(false);
            setSelectedBrand(null);
            setError(null);
        } catch (err: any) {
            console.error("Error updating brand:", err);
            setError(err.message || "Có lỗi xảy ra khi cập nhật thương hiệu");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = getToken();
            if (!accessToken) {
                navigate("/login");
                return;
            }
            await Promise.all([checkAdmin(accessToken), getAllBrands(accessToken)]);
            setIsLoading(false);
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/");
    }, [isLoading, isAdmin, navigate]);

    // Pagination logic
    const filteredBrands = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedBrands = [...filteredBrands].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return aValue.toString().localeCompare(bValue.toString());
    });

    const totalPages = Math.ceil(sortedBrands.length / itemsPerPage);
    const paginatedBrands = sortedBrands.slice(
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
                    <svg className="animate-spin h-8 w-8 text-[#2C5282]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
            <h1 className="text-2xl font-bold text-[#1A202C] mb-4">Quản lý thương hiệu</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            const newBrand: Brand = { id: 0, name: "" };
                            setSelectedBrand(newBrand);
                            setIsCreateModalOpen(true);
                        }}
                        className="bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200 w-full sm:w-auto"
                    >
                        + Tạo thương hiệu mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm thương hiệu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                    />
                </div>
                <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as keyof Brand)}
                    className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200 w-full sm:w-auto"
                >
                    <option value="">-- Sắp xếp theo --</option>
                    <option value="name">Tên thương hiệu</option>
                </select>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                <table className="min-w-full border border-gray-200">
                    <thead>
                        <tr className="bg-[#2C5282] text-white text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-16 sm:w-20">ID</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-left">Tên thương hiệu</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-24 sm:w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedBrands.length > 0 ? (
                            paginatedBrands.map((brand, index) => (
                                <tr
                                    key={brand.id}
                                    className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-[#EDF2F7] transition-colors duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-[#1A202C]">{brand.id}</td>
                                    <td className="py-3 px-4 text-[#1A202C] truncate">{brand.name}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleEditBrand(brand)}
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
                                            onClick={() => handleDeleteBrand(brand.id)}
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
                                <td colSpan={3} className="py-3 px-4 text-center text-[#1A202C]">
                                    Không có thương hiệu
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
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

            {isEditModalOpen && selectedBrand && (
                <BrandForm
                    brand={selectedBrand}
                    onSubmit={handleUpdateBrand}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa thương hiệu"
                />
            )}

            {isCreateModalOpen && selectedBrand && (
                <BrandForm
                    brand={selectedBrand}
                    onSubmit={handleCreateBrandSubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    title="Tạo thương hiệu mới"
                />
            )}
        </div>
    );
};