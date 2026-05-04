import React, { useState, useRef, useEffect } from 'react';

const Chatbot = ({ externalIsOpen, setExternalIsOpen }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    
    // Determine which state to use
    const isControlled = externalIsOpen !== undefined;
    const isOpen = isControlled ? externalIsOpen : internalIsOpen;
    const setIsOpen = isControlled ? setExternalIsOpen : setInternalIsOpen;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: 'Namaste! I am your AgriSahayak AI. How can I assist you with your farming today?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [userName, setUserName] = useState('Farmer Account');
    const [userInit, setUserInit] = useState('U');

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                const name = parsed.user?.name || parsed.name || 'Farmer Account';
                setUserName(name);
                setUserInit(name[0].toUpperCase());
            } catch (e) {}
        }
    }, []);

    const [chatHistory, setChatHistory] = useState(() => {
        const saved = localStorage.getItem('agrisahayak_chats');
        return saved ? JSON.parse(saved) : [];
    });
    const [currentChatId, setCurrentChatId] = useState(Date.now());

    useEffect(() => {
        localStorage.setItem('agrisahayak_chats', JSON.stringify(chatHistory));
    }, [chatHistory]);

    useEffect(() => {
        if (messages.length > 1) {
            setChatHistory(prev => {
                const existingIndex = prev.findIndex(c => c.id === currentChatId);
                const title = messages[1]?.text?.substring(0, 30) + (messages[1]?.text?.length > 30 ? "..." : "") || "New Chat";
                
                const updatedChat = { id: currentChatId, title, messages, date: new Date().toISOString() };
                
                if (existingIndex >= 0) {
                    const newHistory = [...prev];
                    newHistory[existingIndex] = updatedChat;
                    return newHistory;
                } else {
                    return [updatedChat, ...prev];
                }
            });
        }
    }, [messages, currentChatId]);

    const handleNewChat = () => {
        setMessages([{ id: 1, sender: 'ai', text: 'Namaste! I am your AgriSahayak AI. How can I assist you with your farming today?' }]);
        setCurrentChatId(Date.now());
        setSearchQuery('');
    };

    const loadChat = (chat) => {
        setMessages(chat.messages);
        setCurrentChatId(chat.id);
        if(window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const filteredHistory = chatHistory.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Auto-scroll to bottom of chat
    const messagesEndRef = useRef(null);
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputText.trim()) return;
        const userMsg = inputText.trim();
        
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
        setInputText('');
        setIsTyping(true);

        const apiKey = import.meta.env.VITE_GROQ_API_KEY || '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';
        if (!apiKey) {
            setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'Error: Groq API Key is missing.' }]);
            }, 1000);
            return;
        }

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are an agricultural assistant called AgriSahayak." },
                        { role: "user", content: `A farmer named ${userName} says: ${userMsg}. Keep your response concise, helpful, and focused on agriculture.` }
                    ],
                    model: "llama-3.1-8b-instant"
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || "Failed to communicate with Groq API");
            }

            const data = await response.json();
            const responseText = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
            
            setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: responseText }]);
        } catch (error) {
            console.error("Groq API Error:", error);
            setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'Sorry, I encountered an error communicating with the server. Please try again later.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN'; // Default to Indian English

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputText(prev => prev ? prev + ' ' + transcript : transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const handleVoiceCommand = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch(e) {
                console.error(e);
            }
        }
    };

    return (
        <>
            {/* Launcher Button */}
            {!isOpen && (
                <div
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-[0_5px_15px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform z-50 text-2xl"
                >
                    <i className="fas fa-comments"></i>
                </div>
            )}

            {/* Chat Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden relative animate-[scaleIn_0.3s_ease-out]">
                        
                        {/* Sidebar (Gradient Background) */}
                        <div className={`bg-gradient-to-b from-emerald-800 to-white text-emerald-950 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-r border-slate-200'}`}>
                            <div className="p-4 flex flex-col gap-4 h-full min-w-[18rem]">
                                {/* New Chat Button */}
                                <button onClick={handleNewChat} className="w-full flex items-center gap-3 bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-colors border border-emerald-600 font-bold shadow-sm backdrop-blur-sm">
                                    <i className="fas fa-plus"></i> New Chat
                                </button>
                                
                                {/* Search Chat */}
                                <div className="relative">
                                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200"></i>
                                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Chat..." className="w-full bg-black/20 text-sm text-white placeholder-emerald-200/70 rounded-lg pl-9 pr-4 py-2 border border-emerald-600 focus:outline-none focus:border-emerald-400 backdrop-blur-sm" />
                                </div>
                                
                                {/* Previous Chats */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 mt-2">
                                    <h3 className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider mb-3 px-1">Previous 7 Days</h3>
                                    <div className="flex flex-col gap-1">
                                        {filteredHistory.map((chat) => (
                                            <button key={chat.id} onClick={() => loadChat(chat)} className={`text-left w-full p-3 rounded-lg hover:bg-black/5 text-sm text-emerald-950 transition-colors flex items-center justify-between font-medium group ${currentChatId === chat.id ? 'bg-black/10' : ''}`}>
                                                <span className="truncate flex items-center gap-3"><i className="far fa-message text-emerald-700/60"></i> {chat.title}</span>
                                                <i onClick={(e) => {
                                                    e.stopPropagation();
                                                    setChatHistory(prev => prev.filter(c => c.id !== chat.id));
                                                    if (currentChatId === chat.id) handleNewChat();
                                                }} className="fas fa-trash text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity p-1"></i>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Bottom User Info / Settings mock */}
                                <div className="mt-auto pt-4 border-t border-emerald-200 flex items-center gap-3 px-1 cursor-pointer hover:text-emerald-700 transition-colors">
                                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {userInit}
                                    </div>
                                    <span className="font-bold text-sm text-emerald-900">{userName}</span>
                                    <i className="fas fa-cog ml-auto text-emerald-600/70 hover:text-emerald-800"></i>
                                </div>
                            </div>
                        </div>

                        {/* Main Chat Area */}
                        <div className="flex-1 flex flex-col bg-white h-full relative">
                            {/* Header */}
                            <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white/80 backdrop-blur z-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors">
                                        <i className="fas fa-bars text-lg"></i>
                                    </button>
                                    <span className="font-bold text-gray-800">AgriSahayak AI <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full ml-2 align-middle">Beta</span></span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors">
                                    <i className="fas fa-times text-lg"></i>
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-white">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white mt-1 ${msg.sender === 'user' ? 'bg-emerald-600' : 'bg-green-500'}`}>
                                                <i className={`fas ${msg.sender === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                                            </div>
                                            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.sender === 'user' ? 'bg-emerald-50 text-emerald-900 rounded-tr-sm' : 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100'}`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex gap-4 flex-row">
                                            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white mt-1 bg-green-500">
                                                <i className="fas fa-robot"></i>
                                            </div>
                                            <div className="max-w-[85%] rounded-2xl p-4 bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white shrink-0">
                                <div className="max-w-4xl mx-auto relative">
                                    <div className={`flex items-end bg-white border ${isListening ? 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]' : 'border-gray-300 shadow-sm'} rounded-2xl overflow-hidden focus-within:border-emerald-500 focus-within:shadow-md transition-all duration-300 pl-4 py-2 pr-2`}>
                                        <textarea
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Ask AgriSahayak AI..."
                                            className="flex-1 max-h-32 min-h-[44px] resize-none outline-none text-gray-800 text-sm py-3 bg-transparent"
                                            rows="1"
                                        />
                                        <div className="flex items-center gap-1 mb-1 ml-2">
                                            {/* Voice Command Button */}
                                            <button 
                                                onClick={handleVoiceCommand}
                                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 text-gray-500'}`}
                                                title="Voice Command"
                                            >
                                                <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-alt'}`}></i>
                                            </button>
                                            {/* Send Button */}
                                            <button 
                                                onClick={handleSend}
                                                disabled={(!inputText.trim() && !isListening) || isTyping}
                                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${inputText.trim() || isListening ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400'}`}
                                            >
                                                <i className="fas fa-paper-plane"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-center mt-3">
                                        <span className="text-[10px] text-gray-400">AgriSahayak AI can make mistakes. Consider verifying important agricultural data.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
