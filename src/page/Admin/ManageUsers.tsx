import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getToken } from "../../services/localStorageService";

interface Permission {
    name: string;
    description: string;
}

interface Role {
    name: string;
    description: string;
    permissions: Permission[];
}

interface User {
    id: string;
    username: string;
    password?: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    gender?: "male" | "female" | "other";
    roles: Role[];
    status: string;
    isDeleted?: boolean; // Added isDeleted field
}

interface UserFormProps {
    user: User;
    roles: Role[];
    onSubmit: (user: User) => void;
    onCancel: () => void;
    title: string;
}

const UserForm: React.FC<UserFormProps> = ({ user, roles, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState<User>({ ...user });
    const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles.map((r) => r.name));
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = useCallback(() => {
        if (!formData.username || formData.username.trim().length < 3) {
            setError("Tên tài khoản phải có ít nhất 3 ký tự");
            return false;
        }
        if (formData.password && formData.password.length < 6 && formData.id === "0") {
            setError("Mật khẩu phải có ít nhất 6 ký tự khi tạo mới");
            return false;
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError("Email không hợp lệ");
            return false;
        }
        if (!formData.name || formData.name.trim().length < 2) {
            setError("Họ tên phải có ít nhất 2 ký tự");
            return false;
        }
        if (formData.phone && !/^\d{10,11}$/.test(formData.phone)) {
            setError("Số điện thoại phải có 10-11 chữ số");
            return false;
        }
        if (selectedRoles.length === 0) {
            setError("Vui lòng chọn ít nhất một vai trò");
            return false;
        }
        return true;
    }, [formData, selectedRoles]);

    const handleInputChange = useCallback((field: keyof User, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }, []);

    const handleRoleChange = useCallback((roleName: string) => {
        setSelectedRoles((prev) =>
            prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
        );
        setError(null);
    }, []);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!validateForm()) return;
            setIsSubmitting(true);
            try {
                const updatedFormData: User = {
                    ...formData,
                    roles: roles.filter((r) => selectedRoles.includes(r.name)),
                };
                await onSubmit(updatedFormData);
            } finally {
                setIsSubmitting(false);
            }
        },
        [formData, selectedRoles, roles, onSubmit, validateForm]
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">{title}</h2>
                {error && (
                    <div className="bg-red-100 text-[#E53E3E] p-2 rounded mb-4 text-sm">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { label: "Tên tài khoản", name: "username", type: "text", required: true },
                        { label: "Mật khẩu mới", name: "password", type: "password", required: false },
                        { label: "Email", name: "email", type: "email", required: true },
                        { label: "Họ tên", name: "name", type: "text", required: true },
                        { label: "Số điện thoại", name: "phone", type: "text", required: false },
                        { label: "Địa chỉ", name: "address", type: "text", required: false },
                    ].map((field) => (
                        <div key={field.name}>
                            <label
                                htmlFor={field.name}
                                className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData[field.name as keyof User] ? "text-[#2C5282] font-semibold" : ""
                                    }`}
                            >
                                {field.label} {field.required && <span className="text-[#E53E3E]">*</span>}
                            </label>
                            <input
                                type={field.type}
                                id={field.name}
                                value={(formData[field.name as keyof User] as string) || ""}
                                onChange={(e) => handleInputChange(field.name as keyof User, e.target.value)}
                                className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                required={field.required}
                            />
                        </div>
                    ))}
                    <div>
                        <label
                            htmlFor="gender"
                            className={`block text-sm font-medium text-[#1A202C] transition-all duration-300 ${formData.gender ? "text-[#2C5282] font-semibold" : ""
                                }`}
                        >
                            Giới tính
                        </label>
                        <select
                            id="gender"
                            value={formData.gender || "other"}
                            onChange={(e) => handleInputChange("gender", e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                        >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1A202C] mb-2">
                            Vai trò <span className="text-[#E53E3E]">*</span>
                        </label>
                        <div className="space-y-2">
                            {roles.map((role) => (
                                <label key={role.name} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedRoles.includes(role.name)}
                                        onChange={() => handleRoleChange(role.name)}
                                        className="form-checkbox h-5 w-5 text-[#3182CE] focus:ring-[#3182CE]"
                                    />
                                    <span className="ml-2 text-sm text-[#1A202C]">{role.name}</span>
                                </label>
                            ))}
                        </div>
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
                            className={`bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ManageUsers: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [sortField, setSortField] = useState<keyof User | "">("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);
    const API_URL = typeof process !== "undefined" && process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL
        : "http://localhost:8080/datn";

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

    const getAllRoles = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/roles`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error("Không thể lấy danh sách vai trò");
            const data = await response.json();
            const rolesData = Array.isArray(data.result) ? data.result : data.result?.data || [];
            setRoles(rolesData);
        } catch (err: any) {
            console.error("Error fetching roles:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách vai trò");
        }
    }, []);

    const getAllUsers = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate("/login");
                throw new Error("Phiên đăng nhập hết hạn");
            }
            if (!response.ok) throw new Error("Không thể lấy danh sách người dùng");
            const data = await response.json();
            const usersData = Array.isArray(data.result) ? data.result : data.result?.data || [];
            setUsers(usersData);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.message || "Có lỗi xảy ra khi tải danh sách người dùng");
        }
    }, [navigate]);

    const handleEditUser = useCallback((user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteUser = useCallback(
        async (userId: string) => {
            if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
            try {
                const accessToken = getToken();
                if (!accessToken) throw new Error("Không tìm thấy token");
                const response = await fetch(`${API_URL}/users/${userId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (response.status === 401) {
                    navigate("/login");
                    throw new Error("Phiên đăng nhập hết hạn");
                }
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || "Không thể xóa người dùng");
                }
                setUsers((prev) => prev.filter((u) => u.id !== userId));
                setSearchTerm("");
                toast.success("Xóa người dùng thành công!");
            } catch (err: any) {
                console.error("Error deleting user:", err);
                toast.error(err.message || "Có lỗi xảy ra khi xóa người dùng");
            }
        },
        [navigate]
    );

    const handleCreateUser = useCallback(() => {
        const newUser: User = {
            id: "0",
            username: "",
            password: "",
            name: "",
            email: "",
            phone: "",
            address: "",
            gender: "other",
            roles: [],
            status: "1",
            isDeleted: false, // Added default value for isDeleted
        };
        setSelectedUser(newUser);
        setIsCreateModalOpen(true);
    }, []);

    const handleCreateUserSubmit = useCallback(
        async (formData: User) => {
            try {
                const accessToken = getToken();
                if (!accessToken) throw new Error("Không tìm thấy token");
                const payload = {
                    ...formData,
                    roles: formData.roles.map((role) => role.name),
                };
                if (!payload.password) delete payload.password;

                const response = await fetch(`${API_URL}/users`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                if (response.status === 401) {
                    navigate("/login");
                    throw new Error("Phiên đăng nhập hết hạn");
                }
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || "Không thể tạo người dùng");
                }
                const newUser = await response.json();
                setUsers((prev) => [...prev, newUser.result]);
                setIsCreateModalOpen(false);
                setSelectedUser(null);
                toast.success("Tạo người dùng thành công!");
            } catch (err: any) {
                console.error("Error creating user:", err);
                toast.error(err.message || "Có lỗi xảy ra khi tạo người dùng");
            }
        },
        [navigate]
    );

    const handleUpdateUser = useCallback(
        async (formData: User) => {
            try {
                const accessToken = getToken();
                if (!accessToken) throw new Error("Không tìm thấy token");
                const payload = {
                    ...formData,
                    roles: formData.roles.map((role) => role.name),
                };
                if (!payload.password) delete payload.password;

                const response = await fetch(`${API_URL}/users/${payload.id}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                if (response.status === 401) {
                    navigate("/login");
                    throw new Error("Phiên đăng nhập hết hạn");
                }
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || "Không thể cập nhật người dùng");
                }
                const updatedUser = await response.json();
                setUsers((prev) =>
                    prev.map((u) => (u.id === updatedUser.result?.id ? updatedUser.result : u))
                );
                setIsEditModalOpen(false);
                setSelectedUser(null);
                toast.success("Cập nhật người dùng thành công!");
            } catch (err: any) {
                console.error("Error updating user:", err);
                toast.error(err.message || "Có lỗi xảy ra khi cập nhật người dùng");
            }
        },
        [navigate]
    );

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = getToken();
            if (!accessToken) {
                navigate("/login");
                return;
            }
            await Promise.all([checkAdmin(accessToken), getAllUsers(accessToken), getAllRoles(accessToken)]);
            setIsLoading(false);
        };
        fetchData();
    }, [navigate, checkAdmin, getAllUsers, getAllRoles]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/");
    }, [isLoading, isAdmin, navigate]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Pagination logic
    const filteredUsers = users.filter(
        (user) =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return sortDirection === "asc"
            ? aValue.toString().localeCompare(bValue.toString())
            : bValue.toString().localeCompare(aValue.toString());
    });

    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const paginatedUsers = sortedUsers.slice(
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
            <div className="text-center p-6 text-[#E53E3E] bg-red-100 rounded-lg">{error}</div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-[#EDF2F7]">
            <h1 className="text-2xl font-bold text-[#1A202C] mb-4">Quản lý tài khoản</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={handleCreateUser}
                        className="bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200"
                    >
                        + Tạo người dùng mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                    />
                </div>
                <select
                    value={sortField}
                    onChange={(e) => {
                        setSortField(e.target.value as keyof User);
                        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                    }}
                    className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200 w-full sm:w-auto"
                >
                    <option value="">-- Sắp xếp theo --</option>
                    <option value="username">
                        Tên đăng nhập {sortDirection === "asc" ? "↑" : "↓"}
                    </option>
                    <option value="name">Họ tên {sortDirection === "asc" ? "↑" : "↓"}</option>
                    <option value="email">Email {sortDirection === "asc" ? "↑" : "↓"}</option>
                </select>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                <table className="min-w-full border border-gray-200">
                    <thead>
                        <tr className="bg-[#2C5282] text-white text-sm uppercase tracking-wider">
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-16 sm:w-20">
                                STT
                            </th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">
                                Tên đăng nhập
                            </th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Họ tên</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden md:table-cell">
                                Email
                            </th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden md:table-cell">
                                Điện thoại
                            </th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center hidden lg:table-cell">
                                Vai trò
                            </th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Trạng thái</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center">Đã xóa</th>
                            <th className="py-3 px-4 border-b border-gray-200 text-center w-24 sm:w-32">
                                Hành động
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: itemsPerPage }).map((_, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-4">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                    <td className="py-3 px-4 hidden md:table-cell">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                    <td className="py-3 px-4 hidden md:table-cell">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                    <td className="py-3 px-4 hidden lg:table-cell">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                                    </td>
                                </tr>
                            ))
                        ) : paginatedUsers.length > 0 ? (
                            paginatedUsers.map((user, index) => (
                                <tr
                                    key={user.id}
                                    className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-[#EDF2F7] transition-colors duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-[#1A202C]">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center truncate">
                                        {user.username}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center truncate">
                                        {user.name}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center hidden md:table-cell truncate">
                                        {user.email}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center hidden md:table-cell">
                                        {user.phone || "N/A"}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center hidden lg:table-cell truncate">
                                        {user.roles.map((r) => r.name).join(", ") || "N/A"}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span
                                            className={`inline-block w-3 h-3 rounded-full ${user.status === "1" ? "bg-[#38A169]" : "bg-[#E53E3E]"
                                                }`}
                                        ></span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span
                                            className={`inline-block w-3 h-3 rounded-full ${user.isDeleted ? "bg-[#E53E3E]" : "bg-[#38A169]"
                                                }`}
                                        >
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            className="text-[#3182CE] hover:text-[#2C5282] transition-colors duration-200 mr-2 sm:mr-4"
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
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2 2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-[#E53E3E] hover:text-red-700 transition-colors duration-200"
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
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="py-3 px-4 text-center text-[#1A202C]">
                                    Không có người dùng
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

            {isEditModalOpen && selectedUser && (
                <UserForm
                    user={selectedUser}
                    roles={roles}
                    onSubmit={handleUpdateUser}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa người dùng"
                />
            )}

            {isCreateModalOpen && selectedUser && (
                <UserForm
                    user={selectedUser}
                    roles={roles}
                    onSubmit={handleCreateUserSubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    title="Tạo người dùng mới"
                />
            )}
        </div>
    );
};