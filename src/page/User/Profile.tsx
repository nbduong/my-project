import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
                        { label: "Tên tài khoản", name: "username", type: "text", disabled: true },
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
                                disabled={field.disabled}
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

export const Profile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const accessToken = localStorage.getItem("accessToken") || "";

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                setLoading(true);
                const response = await fetch("http://localhost:8080/datn/users/myInfo", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    navigate("/login");
                    throw new Error(`Lỗi khi lấy thông tin user: ${response.statusText}`);
                }

                const data = await response.json();
                setUser(data.result);
            } catch (err: any) {
                setError(err.message || "Lỗi không xác định");
            } finally {
                setLoading(false);
            }
        };

        if (!accessToken) {
            navigate("/login");
            return;
        }
        fetchUserInfo();
    }, [accessToken, navigate]);

    const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

    const handleUpdateUser = async (formData: User) => {
        if (!validateEmail(formData.email)) {
            setError("Email không hợp lệ.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                roles: formData.roles.map(role => role.name),
            };
            if (!payload.password) delete payload.password;

            const response = await fetch(`http://localhost:8080/datn/users/${formData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Không thể cập nhật thông tin");
            }

            const updatedUser = await response.json();
            setUser(updatedUser.result);
            setIsEditing(false);
            setError(null);
            alert("Cập nhật thông tin thành công!");
            window.location.reload();
        } catch (err: any) {
            setError(err.message || "Lỗi không xác định khi cập nhật");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Đang tải thông tin...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen text-red-600">
                <p>Không thể tải thông tin user.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Thông tin cá nhân</h1>
            {error && (
                <div className="mb-4 p-2 bg-red-200 text-red-800 rounded">
                    {error}
                </div>
            )}
            <div className="bg-white p-6 rounded shadow-lg max-w-md">
                <div className="space-y-4">
                    <div><strong>Tên tài khoản:</strong> {user.username}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Họ và tên:</strong> {user.name}</div>
                    <div><strong>Số điện thoại:</strong> {user.phone || "N/A"}</div>
                    <div><strong>Địa chỉ:</strong> {user.address || "N/A"}</div>
                    <div><strong>Giới tính:</strong> {user.gender === "male" ? "Nam" : user.gender === "female" ? "Nữ" : "Khác"}</div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Chỉnh sửa
                    </button>
                </div>
            </div>

            {isEditing && (
                <UserForm
                    user={user}
                    onSubmit={handleUpdateUser}
                    onCancel={() => setIsEditing(false)}
                    title="Chỉnh sửa thông tin cá nhân"
                />
            )}
        </div>
    );
};