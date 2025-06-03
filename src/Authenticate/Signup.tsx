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
        dob: "",
        phone: "",
        address: "",
        gender: "male",
    });

    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const validateEmail = (email: string) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(formData.email)) {
            setError("Email không đúng định dạng.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu và xác nhận mật khẩu không khớp.");
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
        <div className="flex items-start justify-center h-screen bg-[#ffeede] ">
            <form
                onSubmit={handleSubmit}
                className=" p-8  w-[400px] bg-[#E7E8EA] shadow-2xl rounded-2xl"
            >
                <div className="flex justify-center text-3xl font-bold ">
                    <p>ĐĂNG KÝ</p>
                </div>
                <div className="flex justify-center mt-4 mb-4">
                    <p>Nếu bạn đã có tài khoản, <Link to="/login" className="hover:font-bold text-[#371A16]">đăng nhập tại đây</Link></p>
                </div>

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
                    <div key={field.name} className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            {field.label}
                        </label>
                        <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name as keyof typeof formData]}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                ))}



                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-semibold"
                >
                    Đăng ký
                </button>
            </form>
        </div>
    );
};
