import React, { useState, useRef, useEffect } from 'react'

// Assets from local figma mcp server
const imgMenu = "http://localhost:3845/assets/500baaa8c6927574084507a983ef1d2f3ca1f181.svg";
const imgClip = "http://localhost:3845/assets/74a2193423a403dcdd4220396e20470cd291602f.svg";
const imgSend = "http://localhost:3845/assets/7ec3119331019642b036d3081b2518e019c1f5b8.svg";

const imgExample2 = "http://localhost:3845/assets/5ba0970993e0ba180516990dd8a51489631d4d02.png";
const imgImage3 = "/image 3.svg";
const imgImage1 = "/image 1.svg";
const imgTimerBg = "/Example2.svg";
const imgRectangle3 = "http://localhost:3845/assets/e597753f374f81d72b834e02331e42efc244ef4f.svg";

const DUMMY_RESPONSES = [
  "Certainly! The structures of arguments and description modules are mapped correctly inside your Figma draft.",
  "Understood! Let me fetch the code connections for you. Here is what we found on node 11:10.",
  "Generating responsive React components with custom neon pink and purple glows for you.",
  "The timer widget is active. Let me know if you would like me to unpack other nested frames!"
];

function App() {
  const [viewMode, setViewMode] = useState("welcome"); // 'welcome' | 'chat'
  const [inputValue, setInputValue] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef(null);

  // Auto-scroll to bottom when in chat mode
  useEffect(() => {
    if (viewMode === "chat" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, showCode, isTyping, viewMode]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue("");

    if (viewMode === "welcome") {
      // Transition from Welcome screen to Chat cards screen
      setViewMode("chat");
      setChatMessages([{ id: Date.now(), type: 'user', text: userText }]);
      triggerAIReply();
    } else {
      setChatMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userText }]);
      triggerAIReply();
    }
  };

  const triggerAIReply = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const randomIdx = Math.floor(Math.random() * DUMMY_RESPONSES.length);
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          text: DUMMY_RESPONSES[randomIdx]
        }
      ]);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const resetToWelcome = () => {
    setViewMode("welcome");
    setChatMessages([]);
    setShowCode(false);
    setIsTyping(false);
  };

  return (
    <div className="app-viewport">
      {/* Top Left Menu Button (Reset / Welcome back button) */}
      <button className="menu-btn" aria-label="Open menu" onClick={resetToWelcome}>
        <img src={imgMenu} alt="Menu" />
      </button>

      {/* Top Right Timer Widget - only rendered in Chat Mode */}
      {viewMode === "chat" && (
        <div className="timer-widget">
          <img src={imgTimerBg} className="timer-widget-bg" alt="" />
          <div className="timer-icon-group">
            <img src={imgImage1} className="timer-img-1" alt="Clock" />
            <img src={imgImage3} className="timer-img-3" alt="Arrow" />
          </div>
        </div>
      )}

      {/* Content Layout Division */}
      <div className="content-layout">
        
        {/* Welcome Mode Elements */}
        {viewMode === "welcome" && (
          <h1 className="main-title">
            Hello, how may I help you today?
          </h1>
        )}

        {/* Chat Mode Elements (Scrollable Card Area) */}
        {viewMode === "chat" && (
          <div className="scroll-container" ref={scrollRef}>
            <div className="cards-layout">
              {/* Card 1: Description */}
              <div className="figma-card full-card">
                <img src={imgExample2} className="card-texture" alt="" />
                <h2 className="card-title">Description</h2>
              </div>

              {/* Row of two half-width cards */}
              <div className="card-row">
                {/* Card 2: Arguments */}
                <div className="figma-card half-card">
                  <img src={imgExample2} className="card-texture" alt="" />
                  <h2 className="card-title">Arguments</h2>
                </div>
                
                {/* Card 3: Return values */}
                <div className="figma-card half-card">
                  <img src={imgExample2} className="card-texture" alt="" />
                  <h2 className="card-title">Return values</h2>
                </div>
              </div>

              {/* Card 4: TO DO */}
              <div className="figma-card full-card">
                <img src={imgExample2} className="card-texture" alt="" />
                <h2 className="card-title">TO DO</h2>
              </div>

              {/* Card 5: Tips */}
              <div className="figma-card full-card">
                <img src={imgExample2} className="card-texture" alt="" />
                <h2 className="card-title">Tips</h2>
              </div>

              {/* Interactive chat logs in screen flow */}
              {chatMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className="figma-card full-card" 
                  style={{ 
                    height: 'auto', 
                    minHeight: '120px', 
                    borderColor: msg.type === 'user' ? '#ec83bb' : '#cad6e8',
                    boxShadow: msg.type === 'user' ? '0px 4px 20px 0px rgba(236,131,187,0.2)' : '0px 4px 20px 0px rgba(91,71,188,0.3)'
                  }}
                >
                  <img src={imgExample2} className="card-texture" alt="" />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <span style={{ fontSize: '14px', color: msg.type === 'user' ? '#ec83bb' : '#cad6e8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      {msg.type === 'user' ? 'YOU' : 'AI'}
                    </span>
                    <p style={{ fontSize: '20px', lineHeight: 1.5 }}>{msg.text}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="figma-card full-card" style={{ height: 'auto', minHeight: '100px' }}>
                  <img src={imgExample2} className="card-texture" alt="" />
                  <p style={{ fontSize: '18px', fontStyle: 'italic', opacity: 0.7, position: 'relative', zIndex: 2 }}>
                    AI is analyzing...
                  </p>
                </div>
              )}

              {/* Card 6: Reveal code card (Interactive) */}
              <div className="figma-card reveal-card">
                <img src={imgExample2} className="card-texture" alt="" />
                
                <button className="reveal-btn" onClick={() => setShowCode(!showCode)}>
                  <img src={imgRectangle3} className="reveal-btn-bg" alt="" />
                  <span className="reveal-btn-text">
                    {showCode ? "Hide code" : "Reveal code"}
                  </span>
                </button>

                {showCode && (
                  <pre className="code-content-box">
                    <span className="code-comment">// 1:1 Figma Design mapping verified successfully</span>{"\n"}
                    <span className="code-keyword">import</span> React <span className="code-keyword">from</span> <span className="code-string">'react'</span>;{"\n\n"}
                    <span className="code-keyword">export default function</span> <span className="code-func">Slide</span>() &#123;{"\n"}
                    &nbsp;&nbsp;<span className="code-keyword">return</span> ({"\n"}
                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="code-keyword">div</span> className=<span className="code-string">"bg-gradient-to-b from-[#0e0f2e] to-[#2d3094] relative"</span>&gt;{"\n"}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="code-func">DescriptionCard</span> /&gt;{"\n"}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="code-func">ArgumentsRow</span> /&gt;{"\n"}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="code-func">PromptBar</span> className=<span className="code-string">"fixed bottom-[114px]"</span> /&gt;{"\n"}
                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="code-keyword">div</span>&gt;{"\n"}
                    &nbsp;&nbsp;);{"\n"}
                    &#125;
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Prompt Bar (Transitions depending on welcome / chat layout) */}
        <div className={`prompt-bar-wrapper ${viewMode === "welcome" ? "welcome-mode" : "chat-mode"}`}>
          <div className="prompt-bar">
            {/* Flat Clip Button */}
            <button className="clip-btn" aria-label="Attach file">
              <img src={imgClip} alt="Clip" />
            </button>

            {/* Search Input Field */}
            <div className="prompt-left-group">
              <input
                type="text"
                className="prompt-input"
                placeholder="Ask a question"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
            </div>

            {/* Send Button */}
            <button className="send-btn" onClick={handleSend} aria-label="Send message" disabled={isTyping}>
              <img src={imgSend} alt="Send" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
