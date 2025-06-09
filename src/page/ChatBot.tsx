import * as React from 'react';

interface Message {
    text: string;
    sender: 'user' | 'bot';
}

interface Product {
    id: string;
    name: string;
    productCode: string;
    description: string | null;
    price: number;
    quantity: number;
    brandName: string;
    categoryName: string;
    images: string[];
    specifications: { [key: string]: string };
    status: string; // 0: Hết hàng, 1: Hàng sẵn có
    viewCount: number; // Lượt xem sản phẩm
}

export const Chatbot: React.FC = () => {
    const [messages, setMessages] = React.useState<Message[]>(() => {
        const saved = localStorage.getItem('chatHistory');
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = React.useState<string>('');
    const [products, setProducts] = React.useState<Product[]>([]);
    const chatContainerRef = React.useRef<HTMLDivElement>(null);

    // Fetch products from API
    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                console.log('Fetching products from API...');
                const response = await fetch('http://localhost:8080/datn/products', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setProducts(data.result); // Giả sử API trả về mảng sản phẩm
                console.log('Products fetched:', data);
            } catch (error: unknown) {
                console.error('Error fetching products:', error);
            }
        };
        fetchProducts();
    }, []);

    // Save messages to localStorage and scroll to bottom
    React.useEffect(() => {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (): Promise<void> => {
        if (!input.trim()) return;

        // Add user message
        const newMessages = [...messages, { text: input, sender: 'user' }];
        setMessages(newMessages);
        setInput('');

        // Create product list string for context
        const productList = products
            .map(product => `ID: ${product.id}, Name: ${product.name}, Price: ${product.price}, Category: ${product.categoryName}`)
            .join('\n');

        // Create conversation history string with clear context
        const history = newMessages
            .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
            .join('\n');
        const prompt = `Bạn là một trợ lý AI của cửa hàng GearVN, chuyên gia về cấu hình và linh kiện máy tính. Dựa trên lịch sử hội thoại và danh sách sản phẩm dưới đây, trả lời câu hỏi hiện tại hoặc gợi ý sản phẩm phù hợp một cách ngắn gọn trong khoảng 3 dòng đến 5 dòng là nhiều nhất, trực tiếp và liên quan đến ngữ cảnh. Nếu người dùng yêu cầu gợi ý sản phẩm, hãy sử dụng danh sách sản phẩm để đưa ra gợi ý cụ thể, bao gồm tên sản phẩm, giá và lý do gợi ý. Danh sách sản phẩm:\n${productList}\n\nLịch sử hội thoại:\n${history}\n\nUser: ${input}`;

        try {
            console.log('Sending request to Ollama...');
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama3.1',
                    prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: { response: string } = await response.json();
            console.log('Received response:', data);
            setMessages(prev => [...prev, { text: data.response || 'No response from bot', sender: 'bot' }]);
        } catch (error: unknown) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { text: `Error: Could not connect to Ollama server - ${error}`, sender: 'bot' }]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    const clearHistory = (): void => {
        localStorage.removeItem('chatHistory');
        setMessages([]);
    };

    return (
        <div className="min-h-screen flex justify-center items-start p-4">
            <div className="w-full max-w-2xl">
                <h1 className="text-2xl font-bold text-center mb-4">Trợ lý ảo GearBot</h1>
                <div
                    ref={chatContainerRef}
                    className="bg-white border border-gray-300 rounded-lg p-4 h-96 overflow-y-auto mb-4"
                >
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-md mb-2 ${msg.sender === 'user'
                                ? 'bg-cyan-100 ml-10'
                                : 'bg-gray-200 mr-10'
                                }`}
                        >
                            {msg.text}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập câu hỏi hoặc yêu cầu gợi ý sản phẩm..."
                        className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                        Gửi
                    </button>
                    <button
                        onClick={clearHistory}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                        Xóa lịch sử
                    </button>
                </div>
            </div>
        </div>
    );
};