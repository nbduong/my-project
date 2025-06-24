import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { getToken } from "../../services/localStorageService";

// Interface definitions remain unchanged
interface Category {
    id: number;
    name: string;
    description: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Discount {
    id: string;
    code: string;
}

interface Product {
    id: string;
    name: string;
    productCode: string;
    description: string | null;
    salePrice: number;
    quantity: number;
    discountPercent: number | null;
    discountCode: string | null;
    discountId: string | null;
    finalPrice: number | null;
    categoryId: string;
    categoryName: string;
    brandId: string;
    brandName: string;
    images: string[];
    specifications: { [key: string]: string };
    status: string;
    viewCount: number;
    isDeleted: boolean;
    createdBy: string;
    createdDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
}

interface ProductFormData {
    name: string;
    productCode: string;
    description: string | null;
    quantity: number;
    salePrice: number;
    brandId: number;
    categoryId: number;
    specificationsJson: string;
    isDeleted: boolean;
    discountId?: string;
    status?: string;
}

interface ProductFormProps {
    product: Product;
    categories: Category[];
    brands: Brand[];
    discounts: Discount[];
    onSubmit: (product: ProductFormData, images: File[]) => void;
    onCancel: () => void;
    title: string;
}

const ProductForm: React.FC<ProductFormProps> = React.memo(
    ({ product, categories, brands, discounts, onSubmit, onCancel, title }) => {
        const [formData, setFormData] = useState<Product>(
            product
                ? { ...product, salePrice: product.salePrice || 0 }
                : {
                    id: '',
                    name: '',
                    productCode: '',
                    description: null,
                    quantity: 0,
                    salePrice: 0,
                    discountId: null,
                    finalPrice: null,
                    discountCode: '',
                    discountPercent: 0,
                    categoryId: '',
                    categoryName: '',
                    brandId: '',
                    brandName: '',
                    images: [],
                    specifications: {},
                    status: 'ACTIVE',
                    viewCount: 0,
                    isDeleted: false,
                    createdBy: '',
                    createdDate: '',
                    lastModifiedBy: '',
                    lastModifiedDate: '',
                }
        );
        const [selectedImages, setSelectedImages] = useState<File[]>([]);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [specFields, setSpecFields] = useState<{ key: string; value: string }[]>(
            product
                ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
                : []
        );
        const [selectedDiscountCode, setSelectedDiscountCode] = useState<string | undefined>(
            product && product.discountId
                ? discounts.find((discount) => discount.id === product.discountId)?.code
                : undefined
        );
        const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>(
            product ? brands.find((brand) => brand.name === product.brandName)?.id : undefined
        );
        const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
            product ? categories.find((category) => category.name === product.categoryName)?.id : undefined
        );
        const [error, setError] = useState<string | null>(null);

        const validateForm = useCallback(() => {
            if (!formData.name || formData.name.trim().length < 2) {
                setError("Tên sản phẩm phải có ít nhất 2 ký tự");
                return false;
            }
            if (!formData.productCode || formData.productCode.trim().length < 3) {
                setError("Mã sản phẩm phải có ít nhất 3 ký tự");
                return false;
            }
            if (formData.salePrice <= 0) {
                setError("Giá sản phẩm phải lớn hơn 0");
                return false;
            }
            if (formData.quantity < 0) {
                setError("Số lượng sản phẩm không được âm");
                return false;
            }
            if (!selectedBrandId) {
                setError("Vui lòng chọn thương hiệu");
                return false;
            }
            if (!selectedCategoryId) {
                setError("Vui lòng chọn danh mục");
                return false;
            }
            if (formData.description && formData.description.length > 1000) {
                setError("Mô tả không được vượt quá 1000 ký tự");
                return false;
            }
            if (specFields.some((spec) => spec.key && !spec.value)) {
                setError("Vui lòng nhập giá trị cho tất cả thông số kỹ thuật");
                return false;
            }
            return true;
        }, [formData, selectedBrandId, selectedCategoryId, specFields]);

        const handleInputChange = useCallback(
            (field: keyof Product, value: string | number | boolean | string[] | null) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
                setError(null);
            },
            []
        );

        const handleSpecChange = useCallback((index: number, field: 'key' | 'value', value: string) => {
            setSpecFields((prev) => {
                const newFields = [...prev];
                newFields[index] = { ...newFields[index], [field]: value };
                return newFields;
            });
            setError(null);
        }, []);

        const addSpecField = useCallback(() => {
            setSpecFields((prev) => [...prev, { key: '', value: '' }]);
        }, []);

        const removeSpecField = useCallback((index: number) => {
            setSpecFields((prev) => prev.filter((_, i) => i !== index));
            setError(null);
        }, []);

        const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                setSelectedImages(Array.from(e.target.files));
                setError(null);
            }
        }, []);

        const handleSubmit = useCallback(
            async (e: React.FormEvent) => {
                e.preventDefault();
                if (!validateForm()) return;
                setIsSubmitting(true);
                try {
                    const specificationsJson: { [key: string]: string } = {};
                    specFields.forEach(({ key, value }) => {
                        if (key && value) {
                            specificationsJson[key] = value;
                        }
                    });
                    const discountId = selectedDiscountCode
                        ? discounts.find((discount) => discount.code === selectedDiscountCode)?.id
                        : undefined;
                    const updatedFormData: ProductFormData = {
                        name: formData.name,
                        productCode: formData.productCode,
                        description: formData.description,
                        quantity: formData.quantity,
                        salePrice: formData.salePrice,
                        brandId: selectedBrandId!,
                        categoryId: selectedCategoryId!,
                        specificationsJson: JSON.stringify(specificationsJson),
                        isDeleted: formData.isDeleted,
                        discountId,
                        status: formData.status,
                    };
                    await onSubmit(updatedFormData, selectedImages);
                } catch (err: any) {
                    setError(err.message || 'Có lỗi xảy ra khi lưu sản phẩm');
                } finally {
                    setIsSubmitting(false);
                }
            },
            [formData, selectedBrandId, selectedCategoryId, specFields, selectedImages, selectedDiscountCode, discounts, onSubmit, validateForm]
        );

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-xl">
                    <h2 className="text-xl font-bold text-[#1A202C] mb-4">{title}</h2>
                    {error && (
                        <div className="bg-red-100 text-[#E53E3E] p-2 rounded mb-4 text-sm">{error}</div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="productCode"
                                    className={`block text-sm font-medium text-[#1A202C] ${formData.productCode ? 'text-[#2C5282] font-semibold' : ''}`}
                                >
                                    Mã sản phẩm <span className="text-[#E53E3E]">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="productCode"
                                    value={formData.productCode || ''}
                                    onChange={(e) => handleInputChange('productCode', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="name"
                                    className={`block text-sm font-medium text-[#1A202C] ${formData.name ? 'text-[#2C5282] font-semibold' : ''}`}
                                >
                                    Tên sản phẩm <span className="text-[#E53E3E]">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name || ''}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="quantity"
                                    className={`block text-sm font-medium text-[#1A202C] ${formData.quantity ? 'text-[#2C5282] font-semibold' : ''}`}
                                >
                                    Số lượng <span className="text-[#E53E3E]">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="quantity"
                                    value={formData.quantity || 0}
                                    onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] borderを行い

                                    border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                    required
                                    min="0"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="salePrice"
                                    className={`block text-sm font-medium text-[#1A202C] ${formData.salePrice ? 'text-[#2C5282] font-semibold' : ''}`}
                                >
                                    Giá sản phẩm <span className="text-[#E53E3E]">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="salePrice"
                                    value={formData.salePrice || 0}
                                    onChange={(e) => handleInputChange('salePrice', Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="discountCode"
                                    className={`block text-sm font-medium text-[#1A202C] ${selectedDiscountCode ? 'text-[#2C5282] font-semibold' : ''}`}
                                >
                                    Mã giảm giá
                                </label>
                                <select
                                    id="discountCode"
                                    value={selectedDiscountCode ?? ''}
                                    onChange={(e) => {
                                        const code = e.target.value || undefined;
                                        setSelectedDiscountCode(code);
                                        handleInputChange('discountId', code ? discounts.find((d) => d.code === code)?.id || null : null);
                                    }}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                >
                                    <option value="">-- Chọn mã giảm giá --</option>
                                    {discounts.map((discount) => (
                                        <option key={discount.id} value={discount.code}>
                                            {discount.code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="categoryId"
                                    className={`block text-sm font-medium text-[#1A202C] ${selectedCategoryId ? 'text-[#2C5282] font-semibold' : ''}`}
                                >
                                    Danh mục <span className="text-[#E53E3E]">*</span>
                                </label>
                                <select
                                    id="categoryId"
                                    value={selectedCategoryId ?? ''}
                                    onChange={(e) => {
                                        const categoryId = Number(e.target.value);
                                        setSelectedCategoryId(categoryId);
                                        const category = categories.find((cat) => cat.id === categoryId);
                                        handleInputChange('categoryName', category?.name || '');
                                        handleInputChange('categoryId', categoryId.toString());
                                    }}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                    required
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="brandId"
                                    className={`block text-sm font-medium text-[#1A202C] ${selectedBrandId ? 'text-[#2C5282] font-semibold' : ''}`}
                                >
                                    Thương hiệu <span className="text-[#E53E3E]">*</span>
                                </label>
                                <select
                                    id="brandId"
                                    value={selectedBrandId ?? ''}
                                    onChange={(e) => {
                                        const brandId = Number(e.target.value);
                                        setSelectedBrandId(brandId);
                                        const brand = brands.find((b) => b.id === brandId);
                                        handleInputChange('brandName', brand?.name || '');
                                        handleInputChange('brandId', brandId.toString());
                                    }}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                    required
                                >
                                    <option value="">-- Chọn thương hiệu --</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label
                                    htmlFor="description"
                                    className={`block text-sm font-medium text-[#1A202C] ${formData.description ? 'text-[#2C5282] font-semibold' : ''}`}
                                >
                                    Mô tả
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200 h-24 resize-y"
                                    placeholder="Nhập mô tả sản phẩm..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1A202C] mb-2">Trạng thái</label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isDeleted}
                                        onChange={(e) => handleInputChange('isDeleted', e.target.checked)}
                                        className="form-checkbox h-5 w-5 text-[#3182CE] focus:ring-[#3182CE]"
                                    />
                                    <span className="ml-2 text-sm text-[#1A202C]">Đã xóa</span>
                                </label>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#1A202C] mb-2">Thông số kỹ thuật</label>
                                {specFields.map((spec, index) => (
                                    <div key={index} className="flex space-x-2 mb-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Tên thông số"
                                            value={spec.key}
                                            onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                                            className="w-1/2 mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Giá trị"
                                            value={spec.value}
                                            onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                            className="w-1/2 mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeSpecField(index)}
                                            className="text-[#E53E3E] hover:text-red-700 transition-colors duration-200"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addSpecField}
                                    className="bg-[#2C5282] text-white px-3 py-1 rounded-md hover:bg-[#3182CE] transition-all duration-200 mt-2"
                                >
                                    + Thêm thông số
                                </button>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#1A202C]">Chọn ảnh</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleImageChange}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3182CE] border border-gray-300 hover:border-[#2C5282] transition-all duration-200"
                                />
                                {selectedImages.length > 0 && (
                                    <p className="text-sm text-[#1A202C] mt-1">Đã chọn {selectedImages.length} ảnh</p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
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
                                className={`bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
);

const ViewProductModal: React.FC<{ product: Product; discounts: Discount[]; onClose: () => void }> = ({ product, onClose }) => {
    const API_URL = 'http://localhost:8080/datn';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-xl">
                <h2 className="text-xl font-bold text-[#1A202C] mb-4">Chi tiết sản phẩm</h2>
                <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-[#2C5282] mb-3">Thông tin sản phẩm</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Mã sản phẩm', value: product.productCode },
                                { label: 'Tên sản phẩm', value: product.name },
                                { label: 'Thương hiệu', value: product.brandName },
                                { label: 'Danh mục', value: product.categoryName || 'Không có danh mục' },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <label className="block text-sm font-medium text-[#2C5282]">{label}</label>
                                    <p className="mt-1 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-[#1A202C]">
                                        {value}
                                    </p>
                                </div>
                            ))}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#2C5282]">Mô tả</label>
                                <p className="mt-1 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-[#1A202C] h-24 overflow-y-auto">
                                    {product.description || 'Không có mô tả'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-[#2C5282] mb-3">Giá bán sản phẩm</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Giá bán', value: `${product.salePrice.toLocaleString()} VNĐ` },
                                { label: 'Giá cuối cùng', value: product.finalPrice ? `${product.finalPrice.toLocaleString()} VNĐ` : 'N/A' },
                                { label: 'Mã giảm giá', value: product.discountCode || 'Không áp dụng giảm giá' },
                                { label: 'Phần trăm giảm giá', value: product.discountPercent || 'Không áp dụng giảm giá' },
                                { label: 'Số lượng', value: product.quantity.toLocaleString() },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <label className="block text-sm font-medium text-[#2C5282]">{label}</label>
                                    <p className="mt-1 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-[#1A202C]">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-[#2C5282] mb-3">Người tạo & Ngày tạo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Người tạo', value: product.createdBy || 'N/A' },
                                { label: 'Ngày tạo', value: product.createdDate || 'N/A' },
                                { label: 'Người sửa cuối', value: product.lastModifiedBy || 'N/A' },
                                { label: 'Ngày sửa cuối', value: product.lastModifiedDate || 'N/A' },
                                { label: 'Lượt xem', value: product.viewCount.toLocaleString() },
                                { label: 'Trạng thái', value: product.isDeleted ? 'Đã xóa' : product.status },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <label className="block text-sm font-medium text-[#2C5282]">{label}</label>
                                    <p className="mt-1 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-[#1A202C]">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-[#2C5282] mb-3">Thông tin khác</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#2C5282]">Ảnh</label>
                                {product.images.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4 mt-1">
                                        {product.images.map((image, index) => (
                                            <img
                                                key={index}
                                                src={`${API_URL}/${image}`}
                                                alt={`${product.name} image ${index + 1}`}
                                                className="w-32 h-32 object-cover rounded-md border border-gray-200"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/avatar.png';
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[#1A202C] text-sm mt-1">Không có ảnh</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#2C5282] mb-2">Thông số kỹ thuật</label>
                                <div className="mt-1 px-3 py-2 rounded-md border border-gray-300 bg-white">
                                    {Object.entries(product.specifications).length > 0 ? (
                                        Object.entries(product.specifications).map(([key, value]) => (
                                            <p key={key} className="text-sm text-[#1A202C]">
                                                <span className="font-medium">{key}:</span> {value}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-[#1A202C] text-sm">Không có thông số</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-[#1A202C] px-4 py-2 rounded-md hover:bg-gray-400 transition-all duration-200"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ManageProduct: React.FC = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoadingProducts, setIsLoading] = useState<boolean>(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isViewProductModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [sortProductField, setSortField] = useState<keyof Product | ''>('');
    const [productSortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchTermProduct, setSearchTerm] = useState<string>('');
    const [currentPageProduct, setCurrentPage] = useState<number>(1);
    const [itemsPerPageProduct] = useState<number>(10);
    const API_URL = 'http://localhost:8080/datn';

    // Define valid sort fields
    const sortFields: (keyof Product | '')[] = [
        '',
        'productCode',
        'name',
        'finalPrice',
        'quantity',
        'categoryName',
        'status',
        'isDeleted',
        'viewCount',
    ];

    // Reset sort direction to 'asc' when sort field changes
    useEffect(() => {
        setSortDirection('asc');
    }, [sortProductField]);

    const checkAdminStatus = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/users/myInfo`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate('/login');
                throw new Error('Phiên đăng nhập đã hết hạn');
            }
            if (!response.ok) throw new Error('Không thể kiểm tra quyền admin');
            const dataResponse = await response.json();
            if (dataResponse.result?.roles?.some((role: { name: string }) => role.name === 'ADMIN')) {
                setIsAdmin(true);
            } else {
                throw new Error('Không có quyền admin');
            }
        } catch (errData: any) {
            console.error('Error checking admin status:', errData);
            setErrorProducts(errData.message || 'Có lỗi xảy ra khi kiểm tra quyền admin');
        }
    }, [navigate]);

    const fetchAllCategories = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/category`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Không thể lấy danh sách danh mục');
            const dataResponse = await response.json();
            const categoryData = Array.isArray(dataResponse.result) ? dataResponse.result : dataResponse.result?.data || [];
            setCategories(categoryData);
        } catch (errData: any) {
            console.error('Error fetching categories:', errData);
            setErrorProducts(errData.message || 'Có lỗi xảy ra khi lấy danh sách danh mục');
        }
    }, []);

    const fetchAllBrands = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/brand`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Không thể lấy danh sách thương hiệu');
            const dataResponse = await response.json();
            const brandData = Array.isArray(dataResponse.result) ? dataResponse.result : dataResponse.result?.data || [];
            setBrands(brandData);
        } catch (errData: any) {
            console.error('Error fetching brands:', errData);
            setErrorProducts(errData.message || 'Có lỗi xảy ra khi lấy danh sách thương hiệu');
        }
    }, []);

    const fetchAllDiscounts = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/discounts`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Không thể lấy danh sách mã giảm giá');
            const dataResponse = await response.json();
            const discountData = Array.isArray(dataResponse.result) ? dataResponse.result : dataResponse.result?.data || [];
            setDiscounts(discountData);
        } catch (errData: any) {
            console.error('Error fetching discounts:', errData);
            setErrorProducts(errData.message || 'Có lỗi xảy ra khi lấy danh sách mã giảm giá');
        }
    }, []);

    const fetchAllProducts = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate('/login');
                throw new Error('Phiên đăng nhập đã hết hạn');
            }
            if (!response.ok) throw new Error('Không thể lấy danh sách sản phẩm');
            const dataResponse = await response.json();
            const productData = Array.isArray(dataResponse.result) ? dataResponse.result : dataResponse.result?.data || [];
            if (!Array.isArray(productData)) throw new Error('Dữ liệu sản phẩm không hợp lệ');
            setProducts(productData);
        } catch (errData: any) {
            console.error('Error fetching products:', errData);
            setErrorProducts(errData.message || 'Có lỗi xảy ra khi tải danh sách sản phẩm');
        }
    }, [navigate]);

    const handleEditProduct = useCallback((product: Product) => {
        console.log('Selected product for edit:', product);
        if (!product) {
            console.error("Product is null, cannot edit.");
            return;
        }
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteProduct = useCallback(async (productId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        try {
            const accessToken = await getToken();
            if (!accessToken) throw new Error('Access token not found');
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 401) {
                navigate('/login');
                throw new Error('Phiên đăng nhập đã hết hạn');
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể xóa sản phẩm');
            }
            setProducts((prevProducts) => prevProducts.filter((prod) => prod.id !== productId));
            setSearchTerm('');
            toast.success('Xóa sản phẩm thành công!');
        } catch (errorData: any) {
            console.error('Error deleting product:', errorData);
            toast.error(errorData.message || 'Có lỗi xảy ra khi xóa sản phẩm');
        }
    }, [navigate]);

    const handleCreateProduct = useCallback(() => {
        const newProductForm: Product = {
            id: '',
            name: '',
            productCode: '',
            description: null,
            quantity: 0,
            salePrice: 0,
            discountId: null,
            finalPrice: null,
            discountPercent: 0,
            discountCode: '',
            categoryId: '',
            categoryName: '',
            brandId: '',
            brandName: '',
            images: [],
            specifications: {},
            status: 'ACTIVE',
            viewCount: 0,
            isDeleted: false,
            createdBy: '',
            createdDate: '',
            lastModifiedBy: '',
            lastModifiedDate: '',
        };
        setSelectedProduct(newProductForm);
        setIsCreateModalOpen(true);
    }, []);

    const handleCreateSubmit = useCallback(
        async (formData: ProductFormData, images: File[]) => {
            try {
                const accessToken = await getToken();
                if (!accessToken) throw new Error('Access token not found');
                const formDataToSend = new FormData();
                formDataToSend.append('name', formData.name);
                formDataToSend.append('productCode', formData.productCode);
                if (formData.description) {
                    formDataToSend.append('description', formData.description);
                }
                formDataToSend.append('quantity', formData.quantity.toString());
                formDataToSend.append('salePrice', formData.salePrice.toString());
                formDataToSend.append('brandId', formData.brandId.toString());
                formDataToSend.append('categoryId', formData.categoryId.toString());
                formDataToSend.append('specificationsJson', formData.specificationsJson);
                if (formData.discountId) {
                    formDataToSend.append('discountId', formData.discountId);
                }
                if (formData.status) {
                    formDataToSend.append('status', formData.status);
                }
                formDataToSend.append('isDeleted', formData.isDeleted.toString());
                images.forEach((image) => formDataToSend.append('images', image));

                const response = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}` },
                    body: formDataToSend,
                });

                if (response.status === 401) {
                    navigate('/login');
                    throw new Error('Phiên đăng nhập đã hết hạn');
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Không thể tạo sản phẩm');
                }

                const newProductResponse = await response.json();
                setProducts((prevProducts) => [...prevProducts, newProductResponse.result || newProductResponse]);
                setIsCreateModalOpen(false);
                setSelectedProduct(null);
                toast.success('Tạo sản phẩm thành công!');
            } catch (errorData: any) {
                console.error('Error creating product:', errorData);
                toast.error(errorData.message || 'Có lỗi xảy ra khi tạo sản phẩm');
            }
        },
        [navigate]
    );

    const handleUpdateProduct = useCallback(
        async (formData: ProductFormData, images: File[]) => {
            if (!selectedProduct) return;
            try {
                const accessToken = await getToken();
                if (!accessToken) throw new Error('Access token not found');
                const formDataToSend = new FormData();
                formDataToSend.append('name', formData.name);
                formDataToSend.append('productCode', formData.productCode);
                if (formData.description) {
                    formDataToSend.append('description', formData.description);
                }
                formDataToSend.append('quantity', formData.quantity.toString());
                formDataToSend.append('salePrice', formData.salePrice.toString());
                formDataToSend.append('brandId', formData.brandId.toString());
                formDataToSend.append('categoryId', formData.categoryId.toString());
                formDataToSend.append('specificationsJson', formData.specificationsJson);
                if (formData.discountId) {
                    formDataToSend.append('discountId', formData.discountId);
                }
                if (formData.status) {
                    formDataToSend.append('status', formData.status);
                }
                formDataToSend.append('isDeleted', formData.isDeleted.toString());
                images.forEach((image) => formDataToSend.append('images', image));

                const response = await fetch(`${API_URL}/products/${selectedProduct.id}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${accessToken}` },
                    body: formDataToSend,
                });

                if (response.status === 401) {
                    navigate('/login');
                    throw new Error('Phiên đăng nhập đã hết hạn');
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Không thể cập nhật sản phẩm');
                }

                const updatedProductResponse = await response.json();
                setProducts((prevProducts) =>
                    prevProducts.map((prod) => (prod.id === updatedProductResponse.result?.id ? updatedProductResponse.result : prod))
                );
                setIsEditModalOpen(false);
                setSelectedProduct(null);
                toast.success('Cập nhật sản phẩm thành công!');
            } catch (errorData: any) {
                console.error('Error updating product:', errorData);
                toast.error(errorData.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
            }
        },
        [selectedProduct, navigate]
    );

    const handleViewProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsViewModalOpen(true);
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            const accessToken = await getToken();
            if (!accessToken) {
                navigate('/login');
                return;
            }
            setIsLoading(true);
            try {
                await Promise.all([
                    checkAdminStatus(accessToken),
                    fetchAllProducts(accessToken),
                    fetchAllCategories(accessToken),
                    fetchAllBrands(accessToken),
                    fetchAllDiscounts(accessToken),
                ]);
            } catch (errorData: any) {
                setErrorProducts(errorData.message || 'Có lỗi xảy ra khi tải dữ liệu');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [navigate, checkAdminStatus, fetchAllProducts, fetchAllCategories, fetchAllBrands, fetchAllDiscounts]);

    useEffect(() => {
        if (!isLoadingProducts && !isAdmin) navigate('/home');
    }, [isLoadingProducts, isAdmin, navigate]);

    // Filter and sort products
    const filteredProducts = products.filter(
        (prod) =>
            prod.name.toLowerCase().includes(searchTermProduct.toLowerCase()) ||
            (prod.description || '').toLowerCase().includes(searchTermProduct.toLowerCase()) ||
            prod.categoryName.toLowerCase().includes(searchTermProduct.toLowerCase()) ||
            prod.brandName.toLowerCase().includes(searchTermProduct.toLowerCase()) ||
            prod.productCode.toLowerCase().includes(searchTermProduct.toLowerCase())
    );

    const sortedProducts = [...filteredProducts].sort((productA, productB) => {
        if (!sortProductField) return 0;
        if (sortProductField === 'quantity' || sortProductField === 'salePrice' || sortProductField === 'viewCount' || sortProductField === 'finalPrice') {
            const valueA = productA[sortProductField] ?? 0;
            const valueB = productB[sortProductField] ?? 0;
            return productSortDirection === 'asc'
                ? valueA - valueB
                : valueB - valueA;
        }
        if (sortProductField === 'isDeleted') {
            return productSortDirection === 'asc'
                ? Number(productA.isDeleted) - Number(productB.isDeleted)
                : Number(productB.isDeleted) - Number(productA.isDeleted);
        }
        const valueA = productA[sortProductField] || '';
        const valueB = productB[sortProductField] || '';
        return productSortDirection === 'asc'
            ? valueA.toString().localeCompare(valueB.toString())
            : valueB.toString().localeCompare(valueA.toString());
    });

    const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPageProduct);
    const paginatedProducts = sortedProducts.slice(
        (currentPageProduct - 1) * itemsPerPageProduct,
        currentPageProduct * itemsPerPageProduct
    );

    const handlePageChange = useCallback((pageNumber: number) => {
        setCurrentPage(pageNumber);
    }, []);

    if (isLoadingProducts) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#EDF2F7]">
                <div className="flex flex-col items-center">
                    <svg
                        className="animate-spin h-8 w-8 text-[#2C5282]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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

    if (errorProducts) {
        return (
            <div className="text-center p-6 text-[#E53E3E] bg-red-100 rounded-lg">{errorProducts}</div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-[#EDF2F7]">
            <h1 className="text-2xl font-bold text-[#1A202C] mb-4">Quản lý sản phẩm</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={handleCreateProduct}
                        className="w-full sm:w-auto bg-[#2C5282] text-white px-4 py-2 rounded-md hover:bg-[#3182CE] transition-all duration-200"
                    >
                        + Tạo sản phẩm mới
                    </button>
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTermProduct}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 border text-sm border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                    />
                </div>
                <div className="flex flex-col space-y-2">
                    <div>
                        <label className="block text-sm font-medium text-[#1A202C] mb-1">Sắp xếp theo</label>
                        <select
                            value={sortProductField}
                            onChange={(e) => setSortField(e.target.value as keyof Product | '')}
                            className="w-full sm:w-48 border text-sm border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182CE] transition-all duration-200"
                        >
                            <option value="">-- Chọn kiểu sắp xếp --</option>
                            {sortFields.slice(1).map((field) => (
                                <option key={field} value={field}>
                                    {field === 'productCode' && 'Mã sản phẩm'}
                                    {field === 'name' && 'Tên sản phẩm'}
                                    {field === 'finalPrice' && 'Giá bán'}
                                    {field === 'quantity' && 'Số lượng'}
                                    {field === 'categoryName' && 'Danh mục'}
                                    {field === 'status' && 'Trạng thái'}
                                    {field === 'isDeleted' && 'Đã xóa'}
                                    {field === 'viewCount' && 'Lượt xem'}
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
                                checked={productSortDirection === 'asc'}
                                onChange={() => setSortDirection('asc')}
                                className="form-radio h-4 w-4 text-[#3182CE] focus:ring-[#3182CE]"
                            />
                            <span className="ml-2 text-sm text-[#1A202C]">Tăng</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="sortDirection"
                                value="desc"
                                checked={productSortDirection === 'desc'}
                                onChange={() => setSortDirection('desc')}
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
                            <th className="py-3 px-4 border-b text-center sm:table-cell">Mã sản phẩm</th>
                            <th className="py-3 px-4 border-b text-center">Tên sản phẩm</th>
                            <th className="py-3 px-4 border-b text-center hidden md:table-cell">Trạng thái</th>
                            <th className="py-3 px-4 border-b text-center hidden sm:table-cell">Số lượng</th>
                            <th className="py-3 px-4 border-b text-center hidden md:table-cell">Giá bán</th>
                            <th className="py-3 px-4 border-b text-center hidden lg:table-cell">Danh mục</th>
                            <th className="py-3 px-4 border-b text-center w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingProducts ? (
                            Array.from({ length: itemsPerPageProduct }).map((_, idx) => (
                                <tr key={idx}>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4 hidden md:table-cell"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4 hidden sm:table-cell"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4 hidden md:table-cell"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4 hidden lg:table-cell"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                    <td className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-200 rounded"></div></td>
                                </tr>
                            ))
                        ) : paginatedProducts.length > 0 ? (
                            paginatedProducts.map((prod, idx) => (
                                <tr
                                    key={prod.id}
                                    className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-200`}
                                >
                                    <td className="py-3 px-4 text-center text-[#1A202C]">
                                        {(currentPageProduct - 1) * itemsPerPageProduct + idx + 1}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center truncate">{prod.productCode}</td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center">{prod.name}</td>
                                    <td className="py-3 px-4 text-center hidden md:table-cell">
                                        <span
                                            className={`inline-block w-3 h-3 rounded-full ${prod.isDeleted ? 'bg-red-500' : 'bg-green-500'}`}
                                        ></span>
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center hidden sm:table-cell">
                                        {prod.quantity.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center hidden md:table-cell truncate">
                                        {prod.finalPrice !== null ? `${prod.finalPrice.toLocaleString()} VNĐ` : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-[#1A202C] text-center hidden lg:table-cell truncate">
                                        {prod.categoryName || 'Không có danh mục'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button
                                                onClick={() => handleViewProduct(prod)}
                                                className="text-green-500 hover:text-green-600 transition-colors duration-200"
                                                title="Xem chi tiết"
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
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleEditProduct(prod)}
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
                                                onClick={() => handleDeleteProduct(prod.id)}
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
                                    Không tìm thấy sản phẩm
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalProductPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPageProduct - 1)}
                        disabled={currentPageProduct === 1}
                        className={`px-3 py-1 rounded-md text-sm ${currentPageProduct === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors duration-200`}
                    >
                        Trước
                    </button>
                    {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-md text-sm ${currentPageProduct === pageNum ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-all duration-200 border border-gray-200`}
                        >
                            {pageNum}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPageProduct + 1)}
                        disabled={currentPageProduct === totalProductPages}
                        className={`px-3 py-1 rounded-md text-sm ${currentPageProduct === totalProductPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors duration-200`}
                    >
                        Sau
                    </button>
                </div>
            )}

            {isEditModalOpen && selectedProduct && (
                <ProductForm
                    product={selectedProduct}
                    categories={categories}
                    brands={brands}
                    discounts={discounts}
                    onSubmit={handleUpdateProduct}
                    onCancel={() => setIsEditModalOpen(false)}
                    title="Chỉnh sửa sản phẩm"
                />
            )}

            {isCreateModalOpen && selectedProduct && (
                <ProductForm
                    product={selectedProduct}
                    categories={categories}
                    brands={brands}
                    discounts={discounts}
                    onSubmit={handleCreateSubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    title="Tạo sản phẩm mới"
                />
            )}

            {isViewProductModalOpen && selectedProduct && (
                <ViewProductModal
                    product={selectedProduct}
                    discounts={discounts}
                    onClose={() => setIsViewModalOpen(false)}
                />
            )}
        </div>
    );
};