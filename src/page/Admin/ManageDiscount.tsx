import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getToken } from "../../services/localStorageService";

interface Discount {
    id: string;
    startDate: string;
    endDate: string;
    discountPercent: number;
    code: string;
    status: string;
    quantity: number;
    createdBy: string;
    lastModifiedBy: string;
    createdDate: string;
    lastModifiedDate: string;
}

interface DiscountFormData {
    startDate: string;
    endDate: string;
    discountPercent: number;
    code: string;
    status: string;
    quantity: number;
}

interface DiscountFormProps {
    discount: Discount;
    onSubmit: (formData: DiscountFormData) => void;
    onCancel: () => void;
    title: string;
}

const formatDateForInput = (isoDate: string): string => {
    return isoDate ? isoDate.split("T")[0] : "";
};

const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const DiscountForm: React.FC<DiscountFormProps> = React.memo(({ discount, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState<Discount>({
        ...discount,
        startDate: formatDateForInput(discount.startDate),
        endDate: formatDateForInput(discount.endDate),
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = useCallback((field: keyof Discount, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }, []);

    const validateForm = useCallback(() => {
        if (!formData.code || formData.code.trim().length < 3) {
            setError("Mã giảm giá phải có ít nhất 3 ký tự");
            return false;
        }
        if (!/^[a-zA-Z0-9]+$/.test(formData.code)) {
            setError("Mã giảm giá chỉ được chứa chữ cái và số");
            return false;
        }
        if (!formData.startDate) {
            setError("Vui lòng chọn ngày bắt đầu");
            return false;
        }
        if (!formData.endDate) {
            setError("Vui lòng chọn ngày kết thúc");
            return false;
        }
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            setError("Ngày bắt đầu phải trước ngày kết thúc");
            return false;
        }
        if (formData.discountPercent <= 0 || formData.discountPercent > 100) {
            setError("Phần trăm giảm giá phải từ 0 đến 100");
            return false;
        }
        if (formData.quantity < 0) {
            setError("Số lượng không được âm");
            return false;
        }
        if (!formData.status) {
            setError("Vui lòng chọn trạng thái");
            return false;
        }
        return true;
    }, [formData]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!validateForm()) return;
            setIsSubmitting(true);
            try {
                const formattedFormData: DiscountFormData = {
                    ...formData,
                    startDate: `${formData.startDate}T00:00:00`,
                    endDate: `${formData.endDate}T00:00:00`,
                };
                await onSubmit(formattedFormData);
            } catch (err: any) {
                toast.error(err.message || "Có lỗi xảy ra khi lưu mã giảm giá");
            } finally {
                setIsSubmitting(false);
            }
        },
        [formData, onSubmit, validateForm]
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">{title}</h2>
                {error && (
                    <div className="bg-red-100 text-[#E53E3E] p-2 rounded mb-4 text-sm">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="code"
                            className={`block text-sm font-medium text-[#1A202C] ${formData.code ? "text-[#2C5282] font-semibold" : ""}`}
                        >
                            Mã giảm giá <span className="text-[#E53E3E]">*</span>
                        </label>
                        <input
                            type="text"
                            id="code"
                            value={formData.code || ""}
                            onChange={(e) => handleInputChange("code", e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="startDate"
                            className={`block text-sm font-medium text-[#1A202C] ${formData.startDate ? "text-[#2C5282] font-semibold" : ""}`}
                        >
                            Ngày bắt đầu <span className="text-[#E53E3E]">*</span>
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            value={formData.startDate || ""}
                            onChange={(e) => handleInputChange("startDate", e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="endDate"
                            className={`block text-sm font-medium text-[#1A202C] ${formData.endDate ? "text-[#2C5282] font-semibold" : ""}`}
                        >
                            Ngày kết thúc <span className="text-[#E53E3E]">*</span>
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            value={formData.endDate || ""}
                            onChange={(e) => handleInputChange("endDate", e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="discountPercent"
                            className={`block text-sm font-medium text-[#1A202C] ${formData.discountPercent ? "text-[#2C5282] font-semibold" : ""}`}
                        >
                            Phần trăm giảm giá <span className="text-[#E53E3E]">*</span>
                        </label>
                        <input
                            type="number"
                            id="discountPercent"
                            value={formData.discountPercent || ""}
                            onChange={(e) => handleInputChange("discountPercent", Number(e.target.value))}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
                            min="0"
                            max="100"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="quantity"
                            className={`block text-sm font-medium text-[#1A202C] ${formData.quantity ? "text-[#2C5282] font-semibold" : ""}`}
                        >
                            Số lượng <span className="text-[#E53E3E]">*</span>
                        </label>
                        <input
                            type="number"
                            id="quantity"
                            value={formData.quantity || ""}
                            onChange={(e) => handleInputChange("quantity", Number(e.target.value))}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
                            min="0"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="status"
                            className={`block text-sm font-medium text-[#1A202C] ${formData.status ? "text-[#2C5282] font-semibold" : ""}`}
                        >
                            Trạng thái <span className="text-[#E53E3E]">*</span>
                        </label>
                        <select
                            id="status"
                            value={formData.status || "ACTIVE"}
                            onChange={(e) => handleInputChange("status", e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                            required
                        >
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Không hoạt động</option>
                        </select>
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
                            {isSubmitting ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

export const ManageDiscount: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [sortField, setSortField] = useState<keyof Discount | "">("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);
    const API_URL = "http://localhost:8080/datn";

    const sortFields: (keyof Discount | "")[] = [
        "",
        "code",
        "discountPercent",
        "quantity",
        "status",
        "startDate",
        "endDate",
    ];

    useEffect(() => {
        setSortDirection("asc");
    }, [sortField]);

    const fetchData = useCallback(
        async (endpoint: string, errorMessage: string) => {
            const accessToken = await getToken();
            if (!accessToken) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập đã hết hạn");
            }
            if (!response.ok) throw new Error(errorMessage);
            const data = await response.json();
            return Array.isArray(data.result) ? data.result : data.result?.data || data.result || [];
        },
        [navigate]
    );

    const checkAdminStatus = useCallback(async () => {
        try {
            const data = await fetchData("users/myInfo", "Không thể kiểm tra quyền admin");
            if (!data?.roles?.some((role: { name: string }) => role.name === "ADMIN")) {
                throw new Error("Bạn không có quyền admin");
            }
            setIsAdmin(true);
        } catch (err: any) {
            toast.error(err.message || "Có lỗi khi kiểm tra quyền admin");
            setIsAdmin(false); // Ensure isAdmin is false on error
        }
    }, [fetchData]);

    const fetchAllDiscounts = useCallback(async () => {
        try {
            const discountData = await fetchData("discounts", "Không thể lấy danh sách mã giảm giá");
            setDiscounts(discountData);
        } catch (err: any) {
            toast.error(err.message || "Có lỗi khi lấy danh sách mã giảm giá");
        }
    }, [fetchData]);

    const handleEditDiscount = useCallback((discount: Discount) => {
        setSelectedDiscount(discount);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteDiscount = useCallback(
        async (discountId: string) => {
            if (!window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;
            try {
                const accessToken = await getToken();
                if (!accessToken) throw new Error("Access token not found");
                const response = await fetch(`${API_URL}/discounts/${discountId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (response.status === 401) {
                    navigate("/login");
                    throw new Error("Phiên đăng nhập đã hết hạn");
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Không thể xóa mã giảm giá");
                }
                setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
                toast.success("Xóa mã giảm giá thành công!");
            } catch (err: any) {
                toast.error(err.message || "Có lỗi khi xóa mã giảm giá");
            }
        },
        [navigate]
    );

    const handleCreateDiscountSubmit = useCallback(
        async (formData: DiscountFormData) => {
            try {
                const accessToken = await getToken();
                if (!accessToken) throw new Error("Access token not found");
                const response = await fetch(`${API_URL}/discounts`, {
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
                    throw new Error(errData.message || "Không thể tạo mã giảm giá");
                }
                const newDiscount = await response.json();
                setDiscounts((prev) => [...prev, newDiscount.result || newDiscount]);
                setIsCreateModalOpen(false);
                setSelectedDiscount(null);
                toast.success("Tạo mã giảm giá thành công!");
            } catch (err: any) {
                toast.error(err.message || "Có lỗi khi tạo mã giảm giá");
            }
        },
        [navigate]
    );

    const handleUpdateDiscount = useCallback(
        async (formData: DiscountFormData) => {
            try {
                const accessToken = await getToken();
                if (!accessToken) throw new Error("Access token not found");
                const response = await fetch(`${API_URL}/discounts/${selectedDiscount!.id}`, {
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
                    throw new Error(errData.message || "Không thể cập nhật mã giảm giá");
                }
                const updatedDiscount = await response.json();
                setDiscounts((prev) =>
                    prev.map((d) => (d.id === updatedDiscount.result?.id ? updatedDiscount.result : d))
                );
                setIsEditModalOpen(false);
                setSelectedDiscount(null);
                toast.success("Cập nhật mã giảm giá thành công!");
            } catch (err: any) {
                toast.error(err.message || "Có lỗi khi cập nhật mã giảm giá");
            }
        },
        [navigate, selectedDiscount]
    );

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                await checkAdminStatus(); // Run admin check first
                if (isAdmin) {
                    await fetchAllDiscounts(); // Only fetch discounts if admin check passes
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [checkAdminStatus, fetchAllDiscounts, isAdmin]);

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            navigate("/home");
        }
    }, [isLoading, isAdmin, navigate]);

    const filteredDiscounts = discounts.filter((discount) =>
        discount.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedDiscounts = [...filteredDiscounts].sort((a, b) => {
        if (!sortField) return 0;
        if (sortField === "discountPercent" || sortField === "quantity") {
            const valueA = a[sortField] ?? 0;
            const valueB = b[sortField] ?? 0;
            return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
        }
        const valueA = a[sortField] || "";
        const valueB = b[sortField] || "";
        return sortDirection === "asc"
            ? valueA.toString().localeCompare(valueB.toString())
            : valueB.toString().localeCompare(valueA.toString());
    });

    const totalPages = Math.ceil(filteredDiscounts.length / itemsPerPage);
    const paginatedDiscounts = sortedDiscounts.slice(
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

    return (
        <div className="p-4 sm:p-6 bg-[#EDF2F7]">
            <h1 className="text-2xl font-bold text-[#1A202C] mb-4">Quản lý mã giảm giá</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            const newDiscount: Discount = {
                                id: "",
                                code: "",
                                startDate: "",
                                endDate: "",
                                discountPercent: 0,
                                quantity: 0,
                                status: "ACTIVE",
                                createdBy: "",
                                lastModifiedBy: "",
                                createdDate: "",
                                lastModifiedDate: "",
                            };
                            setSelectedDiscount(newDiscount);
                            setIsCreateModalOpen(true);
                        }}
                        className="w-full sm:w-auto bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200"
                    >
                        + Tạo mã giảm giá mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm mã giảm giá..."
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
                            onChange={(e) => setSortField(e.target.value as keyof Discount | "")}
                            className="w-full sm:w-48 border text-sm border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                        >
                            <option value="">-- Chọn kiểu sắp xếp --</option>
                            {sortFields.slice(1).map((field) => (
                                <option key={field} value={field}>
                                    {field === "code" && "Mã giảm giá"}
                                    {field === "discountPercent" && "Phần trăm giảm giá"}
                                    {field === "quantity" && "Số lượng"}
                                    {field === "status" && "Trạng thái"}
                                    {field === "startDate" && "Ngày bắt đầu"}
                                    {field === "endDate" && "Ngày kết thúc"}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="sortDirection"
                                value="asc"
                                checked={sortDirection === "asc"}
                                onChange={() => setSortDirection("asc")}
                                className="form-radio h-4 w-4 text-[#3182CE] focus:ring-[#3182CE]"
                            />
                            <span className="ml-2 text-sm text-[#1A202C]">Tăng</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="sortDirection"
                                value="desc"
                                checked={sortDirection === "desc"}
                                onChange={() => setSortDirection("desc")}
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
                            <th className="py-3 px-4 border-b text-center">Mã giảm giá</th>
                            <th className="py-3 px-4 border-b text-center hidden md:table-cell">Phần trăm giảm</th>
                            <th className="py-3 px-4 border-b text-center hidden sm:table-cell">Số lượng</th>
                            <th className="py-3 px-4 border-b text-center hidden md:table-cell">Trạng thái</th>
                            <th className="py-3 px-4 border-b text-center hidden lg:table-cell">Ngày bắt đầu</th>
                            <th className="py-3 px-4 border-b text-center hidden lg:table-cell">Ngày kết thúc</th>
                            <th className="py-3 px-4 border-b text-center w-24 sm:w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedDiscounts.length > 0 ? (
                            paginatedDiscounts.map((discount, index) => (
                                <tr
                                    key={discount.id}
                                    className={`border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-[#1A202C]">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center truncate">{discount.code}</td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] hidden md:table-cell">
                                        {discount.discountPercent.toLocaleString()}%
                                    </td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] hidden sm:table-cell">
                                        {discount.quantity.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] hidden md:table-cell">
                                        {discount.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                                    </td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] hidden lg:table-cell">
                                        {formatDateForDisplay(discount.startDate)}
                                    </td>
                                    <td className="py-3 px-4 text-center text-[#1A202C] hidden lg:table-cell">
                                        {formatDateForDisplay(discount.endDate)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button
                                                onClick={() => handleEditDiscount(discount)}
                                                className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                                                title="Chỉnh sửa"
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDiscount(discount.id)}
                                                className="text-red-500 hover:text-red-600 transition-colors duration-200"
                                                title="Xóa"
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="py-3 px-4 text-center text-[#666]">
                                    Không tìm thấy mã giảm giá
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
                        className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"} transition-colors duration-200`}
                    >
                        Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-md text-sm ${currentPage === page ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-100"} transition-all duration-200 border border-gray-200`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"} transition-colors duration-200`}
                    >
                        Sau
                    </button>
                </div>
            )}

            {isEditModalOpen && selectedDiscount && (
                <DiscountForm
                    discount={selectedDiscount}
                    onSubmit={handleUpdateDiscount}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa mã giảm giá"
                />
            )}

            {isCreateModalOpen && selectedDiscount && (
                <DiscountForm
                    discount={selectedDiscount}
                    onSubmit={handleCreateDiscountSubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    title="Tạo mã giảm giá mới"
                />
            )}
        </div>
    );
};