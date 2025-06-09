
import React, { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/datn';

interface ApiResponse {
    message: string;
}

// Format timestamp for Vietnam timezone (ICT, +07:00)
const formatTimestamp = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Ho_Chi_Minh',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };
    return now.toLocaleString('vi-VN', options).replace(' AM', ' AM').replace(' PM', ' PM');
};

// Reusable Form Input Component
interface FormInputProps {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    error?: string;
    required?: boolean;
    showToggle?: boolean;
    ref?: React.Ref<HTMLInputElement>; // Added ref prop
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    (
        { id, label, type, value, onChange, placeholder, error, required, showToggle },
        ref,
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        return (
            <div>
                <label htmlFor={id} className="block text-sm font-medium text-[#1F2937]">
                    {label}
                </label>
                <div className="relative mt-1">
                    <input
                        id={id}
                        type={showToggle && showPassword ? 'text' : type}
                        value={value}
                        onChange={onChange}
                        className={`w-full p-2 border ${error ? 'border-[#EF4444]' : 'border-gray-300'
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B82F6]`}
                        placeholder={placeholder}
                        required={required}
                        aria-describedby={error ? `${id}-error` : undefined}
                        aria-label={label}
                        ref={ref} // Forward the ref to the input element
                    />
                    {showToggle && (
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#3B82F6]"
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                    />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
                {error && (
                    <p id={`${id}-error`} className="text-[#EF4444] text-sm mt-1" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    },
);

// Forgot Password Component
const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailError, setEmailError] = useState('');
    const emailRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email) ? '' : 'Vui lòng nhập email hợp lệ.';
    };

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const error = validateEmail(email);
            if (error) {
                setEmailError(error);
                return;
            }
            setIsSubmitting(true);
            try {
                const response = await axios.post<ApiResponse>(`${API_URL}/password/forgot`, { email });
                const timestamp = formatTimestamp();
                toast.success(
                    `${response.data.message || 'Yêu cầu đặt lại mật khẩu đã được gửi!'} (Lúc: ${timestamp})`,
                );
                setEmail('');
                setTimeout(() => navigate('/login'), 3000);
            } catch (err: unknown) {
                const error = err as AxiosError<ApiResponse>;
                if (error.response?.status === 400) {
                    toast.error(error.response.data.message || 'Email không tồn tại.');
                } else if (error.response?.status === 429) {
                    toast.error('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
                } else {
                    toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
                }
            } finally {
                setIsSubmitting(false);
            }
        },
        [email, navigate],
    );

    return (
        <div className="max-w-sm sm:max-w-md mx-auto mt-10 p-4 sm:p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center text-[#1E3A8A] mb-6">Quên Mật Khẩu</h2>
            <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isSubmitting ? 'true' : 'false'}>
                <FormInput
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                    }}
                    placeholder="VD: example@gmail.com"
                    error={emailError}
                    required
                    ref={emailRef}
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#3B82F6] text-white py-2 rounded-md hover:bg-[#2563EB] disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    aria-label="Gửi yêu cầu đặt lại mật khẩu"
                >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                </button>
                <p className="text-center text-sm text-[#1F2937]">
                    Quay lại{' '}
                    <a href="/login" className="text-[#3B82F6] hover:underline" aria-label="Quay lại trang đăng nhập">
                        Đăng nhập
                    </a>
                </p>
            </form>
        </div>
    );
};

// Reset Password Component
const ResetPassword: React.FC<{ token: string }> = ({ token }) => {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        passwordRef.current?.focus();
    }, []);

    const validatePassword = (password: string) => {
        if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            return 'Mật khẩu phải chứa cả chữ và số.';
        }
        return '';
    };

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const passwordErr = validatePassword(newPassword);
            const confirmErr = newPassword !== confirmPassword ? 'Mật khẩu xác nhận không khớp.' : '';
            if (passwordErr || confirmErr) {
                setPasswordError(passwordErr);
                setConfirmError(confirmErr);
                return;
            }
            setIsSubmitting(true);
            try {
                const response = await axios.post<ApiResponse>(`${API_URL}/password/reset`, {
                    newPassword,
                    token,
                });
                const timestamp = formatTimestamp();
                toast.success(
                    `${response.data.message || 'Đặt lại mật khẩu thành công!'} (Lúc: ${timestamp})`,
                );
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => navigate('/login'), 3000);
            } catch (err: unknown) {
                const error = err as AxiosError<ApiResponse>;
                if (error.response?.status === 400) {
                    toast.error(error.response.data.message || 'Token không hợp lệ hoặc đã hết hạn.');
                } else {
                    toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
                }
            } finally {
                setIsSubmitting(false);
            }
        },
        [newPassword, confirmPassword, token, navigate],
    );

    return (
        <div className="max-w-sm sm:max-w-md mx-auto mt-10 p-4 sm:p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center text-[#1E3A8A] mb-6">Đặt Lại Mật Khẩu</h2>
            <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isSubmitting ? 'true' : 'false'}>
                <FormInput
                    id="password"
                    label="Mật khẩu mới"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError('');
                    }}
                    placeholder="Tối thiểu 8 ký tự, chứa chữ và số"
                    error={passwordError}
                    required
                    showToggle
                    ref={passwordRef}
                />
                <FormInput
                    id="confirmPassword"
                    label="Xác nhận mật khẩu"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmError('');
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                    error={confirmError}
                    required
                    showToggle
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#3B82F6] text-white py-2 rounded-md hover:bg-[#2563EB] disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    aria-label="Đặt lại mật khẩu"
                >
                    {isSubmitting ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
                </button>
                <p className="text-center text-sm text-[#1F2937]">
                    Quay lại{' '}
                    <a href="/login" className="text-[#3B82F6] hover:underline" aria-label="Quay lại trang đăng nhập">
                        Đăng nhập
                    </a>
                </p>
            </form>
        </div>
    );
};

// App Component
export const PasswordReset: React.FC = () => {
    const location = useLocation();
    const token = new URLSearchParams(location.search).get('token');

    return token ? <ResetPassword token={token} /> : <ForgotPassword />;
};
