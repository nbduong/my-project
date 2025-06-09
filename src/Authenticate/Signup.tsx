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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const validateForm = () => {
        // Validate username (6-20 ký tự, chỉ chứa chữ, số và dấu gạch dưới)
        if (!/^[a-zA-Z0-9_]{6,20}$/.test(formData.username)) {
            setError("Tên tài khoản phải từ 6-20 ký tự, chỉ chứa chữ, số và dấu gạch dưới");
            return false;
        }

        // Validate password (8-20 ký tự, phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt)
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/.test(formData.password)) {
            setError("Mật khẩu phải từ 8-20 ký tự, chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt");
            return false;
        }

        // Validate confirm password
        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu và xác nhận mật khẩu không khớp");
            return false;
        }

        // Validate email
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            setError("Email không đúng định dạng");
            return false;
        }

        // Validate name (2-50 ký tự, chỉ chứa chữ và khoảng trắng)
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
            headers: {
                "Content-Type": "application/json",
            },
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
        <div className="flex items-start justify-center h-screen bg-[#ffffff]">
            <form
                onSubmit={handleSubmit}
                className="w-[500px] p-6 bg-[#E7E8EA] shadow-xl rounded-2xl"
            >
                <h2 className="text-3xl font-bold text-center text-[#371A16]">
                    ĐĂNG KÝ
                </h2>
                <p className="text-center mt-2">
                    Nếu bạn đã có tài khoản,{" "}
                    <Link
                        to="/login"
                        className="text-[#371A16] font-medium hover:font-bold"
                    >
                        đăng nhập tại đây
                    </Link>
                </p>

                {error && (
                    <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                {[
                    { label: "Tên tài khoản", name: "username", type: "text" },
                    { label: "Mật khẩu", name: "password", type: "password" },
                    {
                        label: "Xác nhận mật khẩu",
                        name: "confirmPassword",
                        type: "password",
                    },
                    { label: "Email", name: "email", type: "email" },
                    { label: "Họ tên", name: "name", type: "text" },
                ].map((field) => (
                    <div key={field.name} className="mt-6 relative">
                        <label
                            htmlFor={field.name}
                            className={`absolute left-3 transition-all duration-300 text-sm font-semibold ${field.name}-label ${formData[field.name as keyof typeof formData]
                                ? "top-[-20px] text-[#371A16]"
                                : "top-1/2 transform -translate-y-[8px] text-gray-500"
                                }`}
                        >
                            {field.label}
                            <sup className="text-red-500">*</sup>
                        </label>
                        <input
                            type={field.type}
                            id={field.name}
                            name={field.name}
                            value={formData[field.name as keyof typeof formData]}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#371A16] transition-all duration-300 border border-gray-300 hover:border-[#371A16] bg-white"
                        />
                    </div>
                ))}

                <div className="mt-6 flex justify-center">
                    <button
                        type="submit"
                        className="w-[200px] h-[50px] bg-[#371A16] text-white font-bold rounded-md hover:bg-white hover:text-[#371A16] shadow-md transition-all duration-300 transform hover:scale-105"
                    >
                        Đăng ký
                    </button>
                </div>
            </form>
        </div>
    );
};