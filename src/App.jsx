import { useState, useRef, useEffect } from 'react'

// Assets from local figma mcp server
const imgExample2 = "http://localhost:3845/assets/5ba0970993e0ba180516990dd8a51489631d4d02.png";
const imgClock = "/image 1.svg";
const imgClockArrow = "/image 3.svg";
const imgClockWidgetBg = "/Group 1.png";
const imgPaperclip = "/paperclip.png";
const imgRectangle3 = "http://localhost:3845/assets/e597753f374f81d72b834e02331e42efc244ef4f.svg";

const DUMMY_RESPONSES = [
  "Certainly! The structures of arguments and description modules are mapped correctly inside your Figma draft.",
  "Understood! Let me fetch the code connections for you. Here is what we found on node 11:10.",
  "Generating responsive React components with custom neon pink and purple glows for you.",
  "The timer widget is active. Let me know if you would like me to unpack other nested frames!"
];

const STATS_OPTIONS = [
  { key: "W", label: "Week", value: 10 },
  { key: "M", label: "Month", value: 30 },
  { key: "Y", label: "Year", value: 100 },
];

const SCORE_RATINGS = {
  W: { red: 2, yellow: 3, green: 5 },
  M: { red: 8, yellow: 10, green: 12 },
  Y: { red: 21, yellow: 34, green: 45 },
};

const REVEAL_HISTORY = {
  W: [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 1 },
    { label: "Thu", value: 3 },
    { label: "Fri", value: 2 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 1 },
  ],
  M: [
    { label: "W1", value: 6 },
    { label: "W2", value: 7 },
    { label: "W3", value: 8 },
    { label: "W4", value: 9 },
  ],
  Y: [
    { label: "Jan", value: 6 },
    { label: "Feb", value: 7 },
    { label: "Mar", value: 9 },
    { label: "Apr", value: 8 },
    { label: "May", value: 10 },
    { label: "Jun", value: 7 },
    { label: "Jul", value: 8 },
    { label: "Aug", value: 9 },
    { label: "Sep", value: 11 },
    { label: "Oct", value: 10 },
    { label: "Nov", value: 12 },
    { label: "Dec", value: 13 },
  ],
};

function App() {
  const [viewMode, setViewMode] = useState("welcome"); // 'welcome' | 'chat' | 'stats'
  const [inputValue, setInputValue] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [statsRange, setStatsRange] = useState("W");

  const scrollRef = useRef(null);
  const nextMessageId = useRef(1);
  const selectedStat = STATS_OPTIONS.find(option => option.key === statsRange) ?? STATS_OPTIONS[0];
  const selectedRatings = SCORE_RATINGS[statsRange];
  const ratingTotal = selectedRatings.red + selectedRatings.yellow + selectedRatings.green;
  const redPercent = Math.round((selectedRatings.red / ratingTotal) * 100);
  const yellowPercent = Math.round((selectedRatings.yellow / ratingTotal) * 100);
  const greenPercent = 100 - redPercent - yellowPercent;
  const selectedHistory = REVEAL_HISTORY[statsRange];
  const maxHistoryValue = Math.max(...selectedHistory.map(item => item.value));

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

    if (viewMode === "welcome" || viewMode === "stats") {
      // Transition from Welcome screen to Chat cards screen
      setViewMode("chat");
      setChatMessages([{ id: nextMessageId.current++, type: 'user', text: userText }]);
      triggerAIReply();
    } else {
      setChatMessages(prev => [...prev, { id: nextMessageId.current++, type: 'user', text: userText }]);
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
          id: nextMessageId.current++,
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
        <span aria-hidden="true"></span>
      </button>

      {/* Top Right Timer Widget */}
      {viewMode !== "stats" && (
        <button className="timer-widget" type="button" aria-label="Open statistics" onClick={() => setViewMode("stats")}>
          <img src={imgClockWidgetBg} className="timer-widget-bg" alt="" />
          <span className="timer-icon-group" aria-hidden="true">
            <img src={imgClock} className="timer-img-1" alt="" />
            <img src={imgClockArrow} className="timer-img-3" alt="" />
          </span>
        </button>
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

        {viewMode === "stats" && (
          <div className="stats-container">
            <h1 className="analytics-title">Analytics</h1>
            <div className="stats-layout">
              <div className="figma-card stats-card reveal-stats-card">
                <img src={imgExample2} className="card-texture" alt="" />
                <div className="compact-card-content">
                  <div className="score-card-header">
                    <h2 className="stats-title">Reveals this {selectedStat.label}</h2>
                    <div className="score-range-controls" aria-label="Reveal code range">
                      {STATS_OPTIONS.map(option => (
                        <button
                          key={option.key}
                          type="button"
                          className={`score-range-btn ${statsRange === option.key ? "active" : ""}`}
                          onClick={() => setStatsRange(option.key)}
                          aria-label={option.label}
                          aria-pressed={statsRange === option.key}
                        >
                          {option.key}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="stats-value">{selectedStat.value}</div>
                </div>
              </div>

              <div className="figma-card stats-card score-card">
                <img src={imgExample2} className="card-texture" alt="" />
                <div className="score-card-content">
                  <div className="score-card-header">
                    <div>
                      <h2 className="score-title">Score ratings</h2>
                    </div>
                    <div className="score-range-controls" aria-label="Score rating range">
                      {STATS_OPTIONS.map(option => (
                        <button
                          key={option.key}
                          type="button"
                          className={`score-range-btn ${statsRange === option.key ? "active" : ""}`}
                          onClick={() => setStatsRange(option.key)}
                          aria-label={option.label}
                          aria-pressed={statsRange === option.key}
                        >
                          {option.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="score-chart-row">
                    <div
                      className="score-chart"
                      style={{
                        "--red": `${redPercent}%`,
                        "--yellow": `${yellowPercent}%`,
                      }}
                      aria-label={`Bad ${redPercent}%, mid ${yellowPercent}%, good ${greenPercent}%`}
                    >
                      <div className="score-chart-center">
                        <span>{ratingTotal}</span>
                        <small>{selectedStat.label}</small>
                      </div>
                    </div>

                    <div className="score-scale">
                      <div className="score-scale-item bad">
                        <span></span>
                        <strong>{selectedRatings.red}</strong>
                        <small>Bad</small>
                      </div>
                      <div className="score-scale-item mid">
                        <span></span>
                        <strong>{selectedRatings.yellow}</strong>
                        <small>Mid</small>
                      </div>
                      <div className="score-scale-item good">
                        <span></span>
                        <strong>{selectedRatings.green}</strong>
                        <small>Good</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="figma-card stats-card bar-card">
                <img src={imgExample2} className="card-texture" alt="" />
                <div className="bar-card-content">
                  <div className="score-card-header">
                    <div>
                      <h2 className="score-title">Reveals history</h2>
                    </div>
                    <div className="score-range-controls" aria-label="Reveal history range">
                      {STATS_OPTIONS.map(option => (
                        <button
                          key={option.key}
                          type="button"
                          className={`score-range-btn ${statsRange === option.key ? "active" : ""}`}
                          onClick={() => setStatsRange(option.key)}
                          aria-label={option.label}
                          aria-pressed={statsRange === option.key}
                        >
                          {option.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bar-chart-shell">
                    <div className="bar-y-axis" aria-hidden="true">
                      {[maxHistoryValue, Math.round(maxHistoryValue * 0.75), Math.round(maxHistoryValue * 0.5), Math.round(maxHistoryValue * 0.25), 0].map(value => (
                        <span key={value}>{value}</span>
                      ))}
                    </div>
                    <div className={`bar-chart range-${statsRange.toLowerCase()}`}>
                      {selectedHistory.map(item => (
                        <div className="bar-item" key={item.label}>
                          <div className="bar-value">{item.value}</div>
                          <div className="bar-track">
                            <span style={{ height: `${Math.max((item.value / maxHistoryValue) * 100, 5)}%` }}></span>
                          </div>
                          <div className="bar-label">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Prompt Bar (Transitions depending on welcome / chat layout) */}
        <div className={`prompt-bar-wrapper ${viewMode === "chat" ? "chat-mode" : "welcome-mode"}`}>
          <div className="prompt-bar">
            {/* Flat Clip Button */}
            <button className="clip-btn" type="button" aria-label="Attach file">
              <img src={imgPaperclip} alt="" aria-hidden="true" />
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
            <button className="send-btn" type="button" onClick={handleSend} aria-label="Send message" disabled={isTyping}>
              <span aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
