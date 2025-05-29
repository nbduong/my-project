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

    const handleInputChange = (field: keyof Brand, value: string) => {
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
                        { label: "Tên thương hiệu", name: "name", type: "text" },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium">{field.label}</label>
                            <input
                                type={field.type}
                                value={formData[field.name as keyof Brand] || ""}
                                onChange={(e) => handleInputChange(field.name as keyof Brand, e.target.value)}
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
        } catch (err) {
            console.error("Error fetching brands:", err);
            setError("Có lỗi xảy ra khi tải danh sách thương hiệu");
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

            if (!response.ok) throw new Error("Không thể xóa thương hiệu");
            setBrands(brands.filter((b) => b.id !== brandId));
            window.location.reload();
        } catch (err) {
            console.error("Error deleting brand:", err);
            setError("Có lỗi xảy ra khi xóa thương hiệu");
        }
    };

    const handleCreateBrand = () => {
        const newBrand: Brand = {
            id: 0,
            name: "",
        };
        setSelectedBrand(newBrand);
        setIsCreateModalOpen(true);
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
            alert("Tạo thương hiệu thành công!");
            setIsCreateModalOpen(false);
            setSelectedBrand(null);
            window.location.reload();
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

            alert("Cập nhật thương hiệu thành công!");
            const updatedBrand = await response.json();
            setBrands(brands.map((b) => (b.id === updatedBrand.id ? updatedBrand : b)));
            setIsEditModalOpen(false);
            setSelectedBrand(null);
            window.location.reload();
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

    if (isLoading) return <p className="text-center">Đang tải...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    const filteredBrands = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedBrands = [...filteredBrands].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return aValue.toString().localeCompare(bValue.toString());
    });

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Quản lý thương hiệu</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleCreateBrand}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        + Tạo thương hiệu mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm thương hiệu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border px-3 py-2 rounded w-64"
                    />
                </div>
                <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as keyof Brand)}
                    className="border px-3 py-2 rounded"
                >
                    <option value="">-- Sắp xếp theo --</option>
                    <option value="name">Tên thương hiệu</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
                    <thead>
                        <tr className="bg-[#371A16] text-white text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b border-gray-200 text-center">ID</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-start">Tên thương hiệu</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBrands.length > 0 ? sortedBrands.map((brand, index) => (
                            <tr
                                key={brand.id}
                                className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors duration-200`}
                            >
                                <td className="py-3 px-4 text-center text-gray-700">{brand.id}</td>
                                <td className="py-3 px-4 text-gray-700">{brand.name}</td>
                                <td className="py-3 px-4 text-center">
                                    <button
                                        onClick={() => handleEditBrand(brand)}
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
                                        onClick={() => handleDeleteBrand(brand.id)}
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
                                    Không có thương hiệu
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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
