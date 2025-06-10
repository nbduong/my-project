import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Signup = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        name: "",
    });

    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const validateForm = () => {
        if (!/^[a-zA-Z0-9_]{6,20}$/.test(formData.username)) {
            setError("Tên tài khoản phải từ 6-20 ký tự, chỉ chứa chữ, số và dấu gạch dưới");
            return false;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/.test(formData.password)) {
            setError("Mật khẩu phải từ 8-20 ký tự, chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt");
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu và xác nhận mật khẩu không khớp");
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            setError("Email không đúng định dạng");
            return false;
        }
        if (!/^[a-zA-Z\s]{2,50}$/.test(formData.name)) {
            setError("Họ tên phải từ 2-50 ký tự, chỉ chứa chữ cái và khoảng trắng");
            return false;
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const payload = { ...formData } as any;
        delete payload.confirmPassword;

        fetch("http://localhost:8080/datn/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.code !== 0) throw new Error(data.message);
                alert("Đăng ký thành công!");
                navigate("/login");
            })
            .catch((err) => {
                setError("Đăng ký thất bại: " + err.message);
            });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg"
            >
                <h2 className="text-3xl font-bold text-center text-[#1E3A8A] mb-4">
                    ĐĂNG KÝ
                </h2>
                <p className="text-center text-sm text-gray-600 mb-6">
                    Nếu bạn đã có tài khoản,{" "}
                    <Link to="/login" className="text-[#3B82F6] font-medium hover:underline">
                        đăng nhập tại đây
                    </Link>
                </p>

                {error && (
                    <div className="bg-[#EF4444]/10 text-[#EF4444] p-2 rounded mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {[
                    { label: "Tên tài khoản", name: "username", type: "text" },
                    { label: "Mật khẩu", name: "password", type: "password" },
                    { label: "Xác nhận mật khẩu", name: "confirmPassword", type: "password" },
                    { label: "Email", name: "email", type: "email" },
                    { label: "Họ tên", name: "name", type: "text" },
                ].map((field) => (
                    <div key={field.name} className="mb-6 relative">
                        <label
                            htmlFor={field.name}
                            className={`absolute left-3 transition-all duration-300 text-sm font-medium ${formData[field.name as keyof typeof formData]
                                ? "top-[-10px] text-[#1E3A8A] bg-white px-1"
                                : "top-1/2 -translate-y-1/2 text-gray-500"
                                }`}
                        >
                            {field.label} <sup className="text-[#EF4444]">*</sup>
                        </label>
                        <input
                            type={field.type}
                            id={field.name}
                            name={field.name}
                            value={formData[field.name as keyof typeof formData]}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                        />
                    </div>
                ))}

                <div className="flex justify-center">
                    <button
                        type="submit"
                        className="w-[200px] py-2 bg-[#3B82F6] text-white font-semibold rounded-md hover:bg-[#2563EB] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-label="Đăng ký"
                    >
                        Đăng ký
                    </button>
                </div>
            </form>
        </div>
    );
};