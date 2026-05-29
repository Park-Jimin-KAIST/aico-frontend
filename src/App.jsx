import { useState } from 'react'

// Assets from local figma mcp server
const imgExample2 = "http://localhost:3845/assets/5ba0970993e0ba180516990dd8a51489631d4d02.png";
const imgClock = "/image 1.svg";
const imgClockArrow = "/image 3.svg";
const imgClockWidgetBg = "/Group 1.png";
const imgPaperclip = "/paperclip.png";
const imgRectangle3 = "http://localhost:3845/assets/e597753f374f81d72b834e02331e42efc244ef4f.svg";

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
  const [viewMode, setViewMode] = useState("assignment"); // 'assignment' | 'processing' | 'review' | 'stats'
  const [taskDescription, setTaskDescription] = useState("");
  const [bottomPrompt, setBottomPrompt] = useState("");
  const [userCode, setUserCode] = useState("");
  const [assignmentFileName, setAssignmentFileName] = useState("");
  const [codeFileName, setCodeFileName] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [isAssignmentExpanded, setIsAssignmentExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [statsRange, setStatsRange] = useState("W");

  const selectedStat = STATS_OPTIONS.find(option => option.key === statsRange) ?? STATS_OPTIONS[0];
  const selectedRatings = SCORE_RATINGS[statsRange];
  const ratingTotal = selectedRatings.red + selectedRatings.yellow + selectedRatings.green;
  const redPercent = Math.round((selectedRatings.red / ratingTotal) * 100);
  const yellowPercent = Math.round((selectedRatings.yellow / ratingTotal) * 100);
  const greenPercent = 100 - redPercent - yellowPercent;
  const selectedHistory = REVEAL_HISTORY[statsRange];
  const maxHistoryValue = Math.max(...selectedHistory.map(item => item.value));

  const handleSend = () => {
    if ((!taskDescription.trim() && !assignmentFileName) || isTyping) return;
    setViewMode("processing");
    triggerAIReply();
  };

  const triggerAIReply = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setViewMode("review");
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSend();
    }
  };

  const resetToWelcome = () => {
    setViewMode("assignment");
    setTaskDescription("");
    setBottomPrompt("");
    setUserCode("");
    setAssignmentFileName("");
    setCodeFileName("");
    setShowCode(false);
    setIsAssignmentExpanded(false);
    setIsTyping(false);
  };

  const handleCodeSubmit = () => {
    if (!userCode.trim()) return;
  };

  const handleBottomPromptSend = () => {
    if (!bottomPrompt.trim()) return;
    setBottomPrompt("");
  };

  const handleAssignmentFile = (file) => {
    if (!file) return;
    setAssignmentFileName(file.name);
  };

  const handleCodeFile = (file) => {
    if (!file) return;
    setCodeFileName(file.name);
    file.text().then(setUserCode).catch(() => {});
  };

  const preventDragDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
        {(viewMode === "assignment" || viewMode === "processing") && (
          <section className={`assignment-panel ${viewMode === "processing" ? "is-processing" : ""}`}>
            <label
              className="assignment-dropzone"
              onDragEnter={preventDragDefaults}
              onDragOver={preventDragDefaults}
              onDrop={(e) => {
                preventDragDefaults(e);
                handleAssignmentFile(e.dataTransfer.files?.[0]);
              }}
            >
              <img src={imgPaperclip} alt="" aria-hidden="true" />
              <span>{assignmentFileName || "Upload your assignment"}</span>
              <input
                type="file"
                className="visually-hidden-input"
                onChange={(e) => handleAssignmentFile(e.target.files?.[0])}
              />
            </label>

            <textarea
              className="assignment-textarea"
              placeholder="Type the task description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />

            <button className="assignment-send-btn send-btn" type="button" onClick={handleSend} aria-label="Send assignment" disabled={isTyping}>
              <span aria-hidden="true"></span>
            </button>

            {viewMode === "processing" && (
              <p className="assignment-status">AI is analyzing...</p>
            )}
          </section>
        )}

        {viewMode === "review" && (
          <div className="scroll-container review-scroll">
            <section className="cards-layout review-cards-layout">
              <div className="assignment-message-row">
                <div className={`assignment-message ${isAssignmentExpanded ? "expanded" : ""}`}>
                  {assignmentFileName && (
                    <span className="assignment-message-file">{assignmentFileName}</span>
                  )}
                  <p>{taskDescription || "Uploaded assignment"}</p>
                  {taskDescription.length > 120 && (
                    <button type="button" onClick={() => setIsAssignmentExpanded(prev => !prev)}>
                      {isAssignmentExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              </div>

              <div className="figma-card full-card">
                <img src={imgExample2} className="card-texture" alt="" />
                <h2 className="card-title">Description</h2>
              </div>

              <div className="card-row">
                <div className="figma-card half-card">
                  <img src={imgExample2} className="card-texture" alt="" />
                  <h2 className="card-title">Arguments</h2>
                </div>
                
                <div className="figma-card half-card">
                  <img src={imgExample2} className="card-texture" alt="" />
                  <h2 className="card-title">Return values</h2>
                </div>
              </div>

              <div className="figma-card full-card">
                <img src={imgExample2} className="card-texture" alt="" />
                <h2 className="card-title">TO DO</h2>
              </div>

              <div className="figma-card full-card">
                <img src={imgExample2} className="card-texture" alt="" />
                <h2 className="card-title">Tips</h2>
              </div>

              <div className="review-workspace">
                <div className="review-column">
                  <div className="figma-card reveal-card review-reveal-card">
                    <img src={imgExample2} className="card-texture" alt="" />
                    
                    <button className="reveal-btn" onClick={() => setShowCode(!showCode)}>
                      <img src={imgRectangle3} className="reveal-btn-bg" alt="" />
                      <span className="reveal-btn-text">
                        {showCode ? "Hide code" : "Reveal AI code"}
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

                <div className="review-column">
                  <div className="figma-card user-code-card">
                    <img src={imgExample2} className="card-texture" alt="" />
                    <div className="user-code-header">
                      <h2 className="card-title">Your code</h2>
                      <label className="clip-btn code-upload-btn" aria-label="Upload code file">
                        <img src={imgPaperclip} alt="" aria-hidden="true" />
                        <input
                          type="file"
                          className="visually-hidden-input"
                          accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.html,.css,.json,.txt"
                          onChange={(e) => handleCodeFile(e.target.files?.[0])}
                        />
                      </label>
                    </div>

                    <div className="code-editor-shell">
                      <div className="editor-topbar">
                        <span></span>
                        <span></span>
                        <span></span>
                        <small>{codeFileName || "solution.jsx"}</small>
                      </div>
                      <div
                        className="editor-body"
                        onDragEnter={preventDragDefaults}
                        onDragOver={preventDragDefaults}
                        onDrop={(e) => {
                          preventDragDefaults(e);
                          handleCodeFile(e.dataTransfer.files?.[0]);
                        }}
                      >
                        <div className="editor-lines" aria-hidden="true">
                          {Array.from({ length: 14 }, (_, idx) => <span key={idx}>{idx + 1}</span>)}
                        </div>
                        <textarea
                          className="code-editor-input"
                          placeholder="Type in the code..."
                          value={userCode}
                          onChange={(e) => setUserCode(e.target.value)}
                          spellCheck="false"
                        />
                      </div>
                    </div>

                    <button className="primary-submit-btn" type="button" onClick={handleCodeSubmit}>
                      Submit for review
                    </button>
                  </div>
                </div>
              </div>
            </section>
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
                      {[maxHistoryValue, Math.round(maxHistoryValue * 0.75), Math.round(maxHistoryValue * 0.5), Math.round(maxHistoryValue * 0.25), 0].map((value, index) => (
                        <span key={`${value}-${index}`}>{value}</span>
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

        {viewMode !== "assignment" && viewMode !== "stats" && (
          <div className="compact-prompt-wrapper">
            <div className="prompt-bar compact-prompt-bar">
              <label className="clip-btn compact-prompt-clip" aria-label="Attach file">
                <img src={imgPaperclip} alt="" aria-hidden="true" />
                <input
                  type="file"
                  className="visually-hidden-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (viewMode === "review") {
                      handleCodeFile(file);
                    } else {
                      handleAssignmentFile(file);
                    }
                  }}
                />
              </label>

              <div className="prompt-left-group compact-prompt-input-wrap">
                <input
                  type="text"
                  className="prompt-input compact-prompt-input"
                  placeholder="Add a note"
                  value={bottomPrompt}
                  onChange={(e) => setBottomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBottomPromptSend();
                    }
                  }}
                  disabled={isTyping}
                />
              </div>

              <button className="send-btn compact-prompt-send" type="button" onClick={handleBottomPromptSend} aria-label="Send note" disabled={isTyping}>
                <span aria-hidden="true"></span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
