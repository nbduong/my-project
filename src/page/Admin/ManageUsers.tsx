import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
}

interface UserFormProps {
    user: User;
    onSubmit: (user: User) => void;
    onCancel: () => void;
    title: string;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState<User>({ ...user });

    const handleInputChange = (field: keyof User, value: string) => {
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
                        { label: "Tên tài khoản", name: "username", type: "text" },
                        { label: "Mật khẩu mới", name: "password", type: "text" },
                        { label: "Email", name: "email", type: "email" },
                        { label: "Họ tên", name: "name", type: "text" },
                        { label: "Số điện thoại", name: "phone", type: "text" },
                        { label: "Địa chỉ", name: "address", type: "text" }
                    ].map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium">{field.label}</label>
                            <input
                                type={field.type}
                                value={(formData[field.name as keyof User] as string) || ""}
                                onChange={(e) => handleInputChange(field.name as keyof User, e.target.value)}
                                className="w-full border px-3 py-2 rounded"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-medium">Giới tính</label>
                        <select
                            value={formData.gender || "other"}
                            onChange={(e) => handleInputChange("gender", e.target.value)}
                            className="w-full border px-3 py-2 rounded"
                        >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded">Hủy</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ManageUsers = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sortField, setSortField] = useState<keyof User | "">("");
    const [searchTerm, setSearchTerm] = useState("");
    const [countId, setCountId] = useState(1);


    const checkAdmin = async (accessToken: string) => {
        try {
            const response = await fetch("http://localhost:8080/datn/users/myInfo", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể kiểm tra quyền admin");

            const data = await response.json();
            if (data.result.roles?.some((role: { name: string }) => role.name === 'ADMIN')) {
                setIsAdmin(true);
            }
        } catch (err) {
            console.error("Error checking admin status:", err);
            setError("Có lỗi xảy ra khi kiểm tra quyền admin");
        }
    };

    const getAllUser = async (accessToken: string) => {
        try {
            const response = await fetch("http://localhost:8080/datn/users", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể lấy danh sách người dùng");

            const data = await response.json();
            setUsers(data.result);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Có lỗi xảy ra khi tải danh sách người dùng");
        }
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
        try {
            const accessToken = getToken();
            const response = await fetch(`http://localhost:8080/datn/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Không thể xóa người dùng");
            setUsers(users.filter((u) => u.id !== userId));
            window.location.reload();
        } catch (err) {
            console.error("Error deleting user:", err);
            setError("Có lỗi xảy ra khi xóa người dùng");
        }
    };

    const handleCreateUser = () => {
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
        };
        setSelectedUser(newUser);
        setIsCreateModalOpen(true);
    };

    const handleCreateUserSubmit = async (formData: User) => {
        try {
            const accessToken = getToken();
            const payload = {
                ...formData,
                roles: formData.roles.map(role => role.name),
            };
            if (!payload.password) delete payload.password;

            const response = await fetch(`http://localhost:8080/datn/users`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể tạo người dùng");
            }

            const newUser = await response.json();
            setUsers([...users, newUser.result]);
            alert("Tạo người dùng thành công!");
            setIsCreateModalOpen(false);
            setSelectedUser(null);
            window.location.reload();
        } catch (err: any) {
            console.error("Error creating user:", err);
            setError(err.message || "Có lỗi xảy ra khi tạo người dùng");
        }
    };

    const handleUpdateUser = async (formData: User) => {
        try {
            const accessToken = getToken();
            const payload = {
                ...formData,
                roles: formData.roles.map(role => role.name),
            };
            if (!payload.password) delete payload.password;

            const response = await fetch(`http://localhost:8080/datn/users/${payload.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể cập nhật người dùng");
            }

            alert("Cập nhật người dùng thành công!");
            const updatedUser = await response.json();
            setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
            setIsEditModalOpen(false);
            setSelectedUser(null);
            window.location.reload();
        } catch (err: any) {
            console.error("Error updating user:", err);
            setError(err.message || "Có lỗi xảy ra khi cập nhật người dùng");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const accessToken = getToken();
            if (!accessToken) {
                navigate("/login");
                return;
            }
            await Promise.all([checkAdmin(accessToken), getAllUser(accessToken)]);
            setIsLoading(false);
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate("/");
    }, [isLoading, isAdmin, navigate]);

    if (isLoading) return <p className="text-center">Đang tải...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        return aValue.toString().localeCompare(bValue.toString());
    });

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">QUẢN LÝ TÀI KHOẢN</h1>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleCreateUser}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        + Tạo người dùng mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border px-3 py-2 rounded w-64"
                    />
                </div>
                <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as keyof User)}
                    className="border px-3 py-2 rounded"
                >
                    <option value="">-- Sắp xếp theo --</option>
                    <option value="name">Họ tên</option>
                    <option value="email">Email</option>
                    <option value="username">Tên đăng nhập</option>
                </select>
            </div>
            <div className="overflow-x-auto ">
                <table className="min-w-full border">
                    <thead>
                        <tr className="bg-[#371A16] text-white">
                            <th className="p-2">Số thứ tự</th><th>Username</th><th>Tên</th><th>Email</th><th>Điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.length > 0 ? sortedUsers.map((user, index) => (
                            
                            <tr key={user.id} className="border-t">
                                <td className="p-2 text-center">{index+1}</td>
                                <td>{user.username}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.phone || "N/A"}</td>
                                <td>{user.roles.map((r) => r.name).join(", ")}</td>
                                <td className="text-center">{user.status === "1" ? "Hoạt động" : "Không hoạt động"}</td>
                                <td className="text-center">
                                    <button onClick={() => handleEditUser(user)} className="text-blue-500"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                    </svg>
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 ml-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={8} className="text-center">Không có người dùng</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isEditModalOpen && selectedUser && (
                <UserForm
                    user={selectedUser}
                    onSubmit={handleUpdateUser}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa người dùng"
                />
            )}

            {isCreateModalOpen && selectedUser && (
                <UserForm
                    user={selectedUser}
                    onSubmit={handleCreateUserSubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    title="Tạo người dùng mới"
                />
            )}
        </div>
    );
};