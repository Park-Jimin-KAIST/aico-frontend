import { useState, useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Editor from '@monaco-editor/react'

const getLanguageFromFilename = (filename) => {
  if (!filename) return 'javascript';
  const ext = filename.split('.').pop().toLowerCase();
  switch(ext) {
    case 'py': return 'python';
    case 'js': case 'jsx': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'java': return 'java';
    case 'c': case 'cpp': return 'cpp';
    case 'cs': return 'csharp';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    default: return 'javascript';
  }
};

// Assets from local figma mcp server
const imgExample2 = "http://localhost:3845/assets/5ba0970993e0ba180516990dd8a51489631d4d02.png";
const imgPaperclip = "/paperclip.png";

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
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [codeFileName, setCodeFileName] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [isAssignmentExpanded, setIsAssignmentExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [completionsRange, setCompletionsRange] = useState("W");
  const [completionsCount, setCompletionsCount] = useState(0);

  const [scoreRange, setScoreRange] = useState("W");
  const [scoreRatings, setScoreRatings] = useState({ unacceptable: 0, poor: 0, fair: 0, good: 0, excellent: 0 });

  const [historyRange, setHistoryRange] = useState("W");
  const [historyData, setHistoryData] = useState([]);
  const [cardData, setCardData] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [collapsedChunks, setCollapsedChunks] = useState({ description: false, arguments: false, returnValues: false, todo: false, tips: false });

  const toggleChunk = (chunkKey) => {
    setCollapsedChunks(prev => ({ ...prev, [chunkKey]: !prev[chunkKey] }));
  };

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing saved user:", e);
      return null;
    }
  });
  const [evalFeedback, setEvalFeedback] = useState(null);

  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pendingNewAssignmentFile, setPendingNewAssignmentFile] = useState(null);
  const [editorHeight, setEditorHeight] = useState(100);
  const [revealedPages, setRevealedPages] = useState(new Set());
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [showConfirmRevealModal, setShowConfirmRevealModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [history, setHistory] = useState([]);

  // Fetch history when user logs in/out
  useEffect(() => {
    if (currentUser && currentUser.userId) {
      fetch(`http://localhost:3000/api/sessions?userId=${currentUser.userId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const mapped = data.map(item => ({
              ...item,
              id: item._id, // map MongoDB _id to frontend id
              timestamp: new Date(item.updatedAt).getTime() // map updatedAt to timestamp
            }));
            setHistory(mapped);
          }
        })
        .catch(console.error);
    } else {
      const saved = localStorage.getItem("aico_chat_history");
      try {
        setHistory(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setHistory([]);
      }
    }
  }, [currentUser]);

  // Save guest history to localStorage
  useEffect(() => {
    if (!currentUser && history.length > 0) {
      localStorage.setItem("aico_chat_history", JSON.stringify(history));
    }
  }, [history, currentUser]);

  // Handle ESC key to close code modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCodeModalOpen) {
        setIsCodeModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCodeModalOpen]);

  // Debounced API call / localStorage save for code/feedback/prompt changes
  useEffect(() => {
    if (!currentSessionId) return;

    const delayDebounceFn = setTimeout(() => {
      const updatedPages = [...pages];
      if (updatedPages.length > 0 && currentPageIndex >= 0) {
        updatedPages[currentPageIndex] = {
          ...updatedPages[currentPageIndex],
          taskDescription,
          assignmentFileName,
          cardData,
          userCode,
          evalFeedback
        };
      }

      const sessionData = {
        title: updatedPages.length > 0 ? (updatedPages[0].taskDescription?.slice(0, 30) || updatedPages[0].assignmentFileName || "Untitled Assignment") : (taskDescription.slice(0, 30) || assignmentFileName || "Untitled Assignment"),
        pages: updatedPages,
        taskDescription,
        assignmentFileName,
        cardData,
        userCode,
        evalFeedback,
        timestamp: Date.now()
      };

      // 1. Update React state
      setHistory(prev => {
        return prev.map(item => {
          if (item.id === currentSessionId) {
            return { ...item, ...sessionData };
          }
          return item;
        });
      });

      // 2. Update MongoDB if logged in
      if (currentUser && currentUser.userId) {
        fetch(`http://localhost:3000/api/sessions/${currentSessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionData)
        }).catch(console.error);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [userCode, evalFeedback, cardData, taskDescription, assignmentFileName, currentSessionId, currentUser]); // Exclude pages to prevent infinite loop

  useEffect(() => {
    if (viewMode === "stats" && currentUser) {
      fetch(`http://localhost:3000/api/stats?userId=${currentUser.userId}&range=${completionsRange}`)
        .then(res => res.json())
        .then(data => setCompletionsCount(data.totalCompletedWithoutReveal || data.totalReveals || 0))
        .catch(console.error);
    }
  }, [viewMode, completionsRange, currentUser]);

  useEffect(() => {
    if (viewMode === "stats" && currentUser) {
      fetch(`http://localhost:3000/api/stats?userId=${currentUser.userId}&range=${scoreRange}`)
        .then(res => res.json())
        .then(data => setScoreRatings(data.scoreRatings || { unacceptable: 0, poor: 0, fair: 0, good: 0, excellent: 0 }))
        .catch(console.error);
    }
  }, [viewMode, scoreRange, currentUser]);

  useEffect(() => {
    if (viewMode === "stats" && currentUser) {
      fetch(`http://localhost:3000/api/stats?userId=${currentUser.userId}&range=${historyRange}`)
        .then(res => res.json())
        .then(data => setHistoryData(data.history || []))
        .catch(console.error);
    }
  }, [viewMode, historyRange, currentUser]);
  
  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      setCurrentUser(data);
      localStorage.setItem("currentUser", JSON.stringify(data));
    } catch (e) {
      const decoded = jwtDecode(credentialResponse.credential);
      const mockUser = { userId: "mock-id-123", name: decoded.name, picture: decoded.picture };
      setCurrentUser(mockUser);
      localStorage.setItem("currentUser", JSON.stringify(mockUser));
    }
  };

  const parseTodoText = (text) => {
    if (!text) return null;
    const steps = text.split(/(?=Step \d+:)/).filter(s => s.trim() !== "");
    if (steps.length === 1) return <p className="card-content-text">{text}</p>;
    return (
      <ul className="todo-list">
        {steps.map((step, idx) => (
          <li key={idx} className="todo-list-item">{step.trim()}</li>
        ))}
      </ul>
    );
  };

  const renderTextWithInlineCode = (text) => {
    if (!text) return null;
    
    // Split by newlines to explicitly handle them
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(`[^`]+`)/g);
      const renderedLine = parts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={idx} className="inline-code-highlight">
              {part.slice(1, -1)}
            </code>
          );
        }
        
        // Highlight keywords and significant words
        const words = part.split(/(\b(?:int|integer|float|double|str|string|bool|boolean|char|list|dict|dictionary|array|numpy array|tuple|set|object|None|null|void|undefined)\b|\b(?:Hint|Note|Important|Warning|Step)\s*:)/gi);
        if (words.length > 1) {
          return (
            <span key={idx}>
              {words.map((subPart, subIdx) => {
                if (/^(int|integer|float|double|str|string|bool|boolean|char|list|dict|dictionary|array|numpy array|tuple|set|object|None|null|void|undefined)$/i.test(subPart)) {
                  return <strong key={subIdx} className="keyword-highlight">{subPart}</strong>;
                }
                if (/^(Hint|Note|Important|Warning|Step)\s*:/i.test(subPart)) {
                  return <strong key={subIdx} style={{ color: '#ffcc00', fontWeight: 'bold' }}>{subPart}</strong>;
                }
                return subPart;
              })}
            </span>
          );
        }
        return part;
      });

      return (
        <span key={lineIdx}>
          {renderedLine}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  const formatArgumentsOrReturnValues = (text) => {
    if (!text) return null;
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    return (
      <ul className="formatted-list">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[-*\u2022\d.]+\s*/, "").trim();
          if (!cleanLine) return null;

          const firstPuncIdx = cleanLine.search(/[\(:\-]/);
          if (firstPuncIdx !== -1) {
            const boldPart = cleanLine.substring(0, firstPuncIdx).trim();
            const restPart = cleanLine.substring(firstPuncIdx).trim();
            return (
              <li key={idx} className="formatted-list-item">
                <strong>{boldPart}</strong> {renderTextWithInlineCode(restPart)}
              </li>
            );
          } else {
            const words = cleanLine.split(/\s+/);
            if (words.length <= 3) {
              return (
                <li key={idx} className="formatted-list-item">
                  <strong>{renderTextWithInlineCode(cleanLine)}</strong>
                </li>
              );
            }
            return (
              <li key={idx} className="formatted-list-item">
                {renderTextWithInlineCode(cleanLine)}
              </li>
            );
          }
        })}
      </ul>
    );
  };

  const selectedCompletionsStat = STATS_OPTIONS.find(option => option.key === completionsRange) ?? STATS_OPTIONS[0];
  const selectedScoreStat = STATS_OPTIONS.find(option => option.key === scoreRange) ?? STATS_OPTIONS[0];
  const selectedHistoryStat = STATS_OPTIONS.find(option => option.key === historyRange) ?? STATS_OPTIONS[0];

  const ratingTotal = (scoreRatings.unacceptable || 0) + (scoreRatings.poor || 0) + (scoreRatings.fair || 0) + (scoreRatings.good || 0) + (scoreRatings.excellent || 0);
  const unacceptablePercent = ratingTotal ? Math.round(((scoreRatings.unacceptable || 0) / ratingTotal) * 100) : 0;
  const poorPercent = ratingTotal ? Math.round(((scoreRatings.poor || 0) / ratingTotal) * 100) : 0;
  const fairPercent = ratingTotal ? Math.round(((scoreRatings.fair || 0) / ratingTotal) * 100) : 0;
  const goodPercent = ratingTotal ? Math.round(((scoreRatings.good || 0) / ratingTotal) * 100) : 0;
  const excellentPercent = ratingTotal ? 100 - unacceptablePercent - poorPercent - fairPercent - goodPercent : 0;
  const selectedRatings = scoreRatings;
  const maxHistoryValue = historyData.length > 0 ? Math.max(...historyData.map(item => item.value)) : 10;

  const handleSend = () => {
    if ((!taskDescription.trim() && !assignmentFileName) || isTyping) return;
    setViewMode("processing");
    triggerAIReply();
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const triggerAIReply = async () => {
    setIsTyping(true);
    try {
      let fileData = null;
      let fileMimeType = null;
      if (assignmentFile) {
        const base64String = await fileToBase64(assignmentFile);
        fileData = base64String.split(",")[1];
        fileMimeType = assignmentFile.type;
      }

      const response = await fetch("http://localhost:3000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: taskDescription,
          file: fileData ? { data: fileData, mimeType: fileMimeType } : null
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setCardData(data);
      setViewMode("review");

      const sessionTitle = taskDescription.slice(0, 30) || assignmentFileName || "Untitled Assignment";
      
      const firstPage = {
        taskDescription,
        assignmentFileName,
        cardData: data,
        userCode: "",
        evalFeedback: null,
        codeRevealed: false,
        completedWithoutReveal: false
      };
      setPages([firstPage]);
      setCurrentPageIndex(0);

      if (currentUser && currentUser.userId) {
        // Save to MongoDB
        const res = await fetch("http://localhost:3000/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.userId,
            title: sessionTitle,
            taskDescription,
            assignmentFileName,
            cardData: data,
            pages: [firstPage],
            userCode: "",
            evalFeedback: null
          })
        });
        const savedSession = await res.json();
        const sid = savedSession._id;
        setCurrentSessionId(sid);

        setHistory(prev => {
          const newSession = {
            id: sid,
            title: sessionTitle,
            taskDescription,
            assignmentFileName,
            cardData: data,
            pages: [firstPage],
            userCode: "",
            evalFeedback: null,
            timestamp: Date.now()
          };
          const exists = prev.some(item => item.id === sid);
          if (exists) {
            return prev.map(item => item.id === sid ? newSession : item);
          }
          return [newSession, ...prev];
        });
      } else {
        // Guest mode - localStorage
        let sid = currentSessionId;
        if (!sid) {
          sid = Date.now().toString();
          setCurrentSessionId(sid);
        }

        setHistory(prev => {
          const exists = prev.some(item => item.id === sid);
          let updated;
          if (exists) {
            updated = prev.map(item => item.id === sid ? {
              ...item,
              title: sessionTitle,
              taskDescription,
              assignmentFileName,
              cardData: data,
              timestamp: Date.now()
            } : item);
          } else {
            const newSession = {
              id: sid,
              title: sessionTitle,
              taskDescription,
              assignmentFileName,
              cardData: data,
              pages: [firstPage],
              userCode: "",
              evalFeedback: null,
              timestamp: Date.now()
            };
            updated = [newSession, ...prev];
          }
          localStorage.setItem("aico_chat_history", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      alert("Error generating content. Please check the backend server.");
      setViewMode("assignment");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSend();
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setViewMode("assignment");
    setTaskDescription("");
    setBottomPrompt("");
    setUserCode("");
    setAssignmentFileName("");
    setAssignmentFile(null);
    setCodeFileName("");
    setCardData(null);
    setEvalFeedback(null);
    setShowCode(false);
    setIsAssignmentExpanded(false);
    setIsTyping(false);
    setIsSidebarOpen(false);
  };

  const loadSession = (session) => {
    setCurrentSessionId(session.id);
    setTaskDescription(session.taskDescription || "");
    setBottomPrompt(session.bottomPrompt || "");
    setUserCode(session.userCode || "");
    setAssignmentFileName(session.assignmentFileName || "");
    setAssignmentFile(null);
    setCardData(session.cardData);
    setEvalFeedback(session.evalFeedback || null);
    setPages(session.pages || []);
    setCurrentPageIndex(session.pages && session.pages.length > 0 ? 0 : 0);
    setViewMode("review");
    setIsSidebarOpen(false);
  };

  const deleteSession = async (id) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    
    if (currentSessionId === id) {
      startNewSession();
    }

    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      if (!currentUser) {
        localStorage.setItem("aico_chat_history", JSON.stringify(updated));
      }
      return updated;
    });

    if (currentUser && currentUser.userId) {
      try {
        await fetch(`http://localhost:3000/api/sessions/${id}`, {
          method: "DELETE"
        });
      } catch (err) {
        console.error("Failed to delete session on server:", err);
      }
    }
  };

  const resetToWelcome = () => {
    if (viewMode === "stats") {
      setViewMode(cardData ? "review" : "assignment");
      return;
    }
    setViewMode("assignment");
    setTaskDescription("");
    setBottomPrompt("");
    setUserCode("");
    setAssignmentFileName("");
    setAssignmentFile(null);
    setCodeFileName("");
    setCardData(null);
    setShowCode(false);
    setIsAssignmentExpanded(false);
    setIsTyping(false);
  };

  const handleCodeSubmit = async () => {
    if (!userCode.trim()) return;
    if (!currentUser) return alert("Please login first to submit code.");
    setIsEvaluating(true);
    try {
      const res = await fetch("http://localhost:3000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.userId, code: userCode, taskDescription })
      });
      const data = await res.json();
      setEvalFeedback(data);
      setExpandedCard({ title: `Evaluation: ${data.rating}`, content: <p className="card-content-text">{data.feedback}</p> });

      // Calculate completedWithoutReveal
      const isGoodOrExcellent = data.rating === "GOOD" || data.rating === "EXCELLENT";
      const currentPage = pages[currentPageIndex];
      const isRevealed = currentPage?.codeRevealed || false;
      const completedWithoutReveal = isGoodOrExcellent && !isRevealed;

      const updatedPages = [...pages];
      if (updatedPages.length > 0 && currentPageIndex >= 0) {
        updatedPages[currentPageIndex] = {
          ...updatedPages[currentPageIndex],
          evalFeedback: data,
          completedWithoutReveal: completedWithoutReveal || (updatedPages[currentPageIndex].completedWithoutReveal || false)
        };
        setPages(updatedPages);
      }
    } catch (e) { console.error(e); }
    setIsEvaluating(false);
  };
  
  const handleReveal = () => {
    if (!showCode) {
      setShowConfirmRevealModal(true);
      return;
    }
    setShowCode(false);
  };

  const confirmReveal = async () => {
    setShowConfirmRevealModal(false);
    setShowCode(true);

    const updatedPages = [...pages];
    if (updatedPages.length > 0 && currentPageIndex >= 0) {
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        codeRevealed: true
      };
      setPages(updatedPages);
    }

    if (currentUser) {
      const pageKey = `${currentSessionId}-${currentPageIndex}`;
      if (!revealedPages.has(pageKey)) {
        setRevealedPages(prev => new Set([...prev, pageKey]));
        try {
          await fetch("http://localhost:3000/api/reveal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.userId })
          });
        } catch (e) { console.error(e); }
      }

      if (currentSessionId) {
        // Save codeRevealed change to MongoDB session
        const sessionData = {
          title: updatedPages.length > 0 ? (updatedPages[0].taskDescription?.slice(0, 30) || updatedPages[0].assignmentFileName || "Untitled Assignment") : (taskDescription.slice(0, 30) || assignmentFileName || "Untitled Assignment"),
          pages: updatedPages,
          taskDescription,
          assignmentFileName,
          cardData,
          userCode,
          evalFeedback,
          timestamp: Date.now()
        };
        try {
          await fetch(`http://localhost:3000/api/sessions/${currentSessionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sessionData)
          });
        } catch (e) { console.error(e); }
      }
    }
  };

  const handlePageChange = (index) => {
    if (index >= 0 && index < pages.length) {
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        taskDescription,
        assignmentFileName,
        cardData,
        userCode,
        evalFeedback
      };
      setPages(updatedPages);
      
      setCurrentPageIndex(index);
      const nextPage = updatedPages[index];
      setTaskDescription(nextPage.taskDescription || "");
      setAssignmentFileName(nextPage.assignmentFileName || "");
      setCardData(nextPage.cardData || null);
      setUserCode(nextPage.userCode || "");
      setEvalFeedback(nextPage.evalFeedback || null);
      setShowCode(false);
    }
  };

  const handleBottomPromptSend = async () => {
    if (!bottomPrompt.trim() && !pendingNewAssignmentFile) return;

    if (viewMode === "review") {
      setIsTyping(true);
      let fileName = assignmentFileName;
      
      try {
        let fileData = null;
        let fileMimeType = null;
        
        if (pendingNewAssignmentFile) {
          fileName = pendingNewAssignmentFile.name;
          const base64String = await fileToBase64(pendingNewAssignmentFile);
          fileData = base64String.split(",")[1];
          fileMimeType = pendingNewAssignmentFile.type;
        } else if (assignmentFile) {
          const base64String = await fileToBase64(assignmentFile);
          fileData = base64String.split(",")[1];
          fileMimeType = assignmentFile.type;
        }

        let fullPrompt = bottomPrompt || "Please analyze this file.";
        
        // Pass conversation history so the AI knows the context
        if (pages.length > 0) {
          const historyContext = pages.map((p, i) => `[Turn ${i + 1}]\nUser: ${p.taskDescription}\nAI Description: ${p.cardData?.description}\n`).join("\n");
          fullPrompt = `[Previous Conversation History]\n${historyContext}\n\n[Current Request]\n${fullPrompt}`;
        }

        const aiResponse = await fetch("http://localhost:3000/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: fullPrompt,
            file: fileData ? { data: fileData, mimeType: fileMimeType } : null
          })
        });
        const data = await aiResponse.json();
        
        if (!aiResponse.ok) {
          throw new Error(data.error || "Failed to generate AI analysis");
        }

        const newPage = {
          taskDescription: bottomPrompt || "Updated file",
          assignmentFileName: fileName,
          cardData: data,
          userCode: "",
          evalFeedback: null,
          codeRevealed: false,
          completedWithoutReveal: false
        };
        const newPages = [...pages, newPage];
        setPages(newPages);
        setCurrentPageIndex(newPages.length - 1);
        
        setTaskDescription(newPage.taskDescription);
        setAssignmentFileName(fileName);
        setCardData(data);
        setUserCode("");
        setEvalFeedback(null);
        setShowCode(false);
        setPendingNewAssignmentFile(null);
        setBottomPrompt("");
      } catch (err) {
        console.error(err);
        alert(err.message || "Failed to analyze the new assignment.");
      }
      setIsTyping(false);
      return;
    }

    setBottomPrompt("");
  };

  const handleAssignmentFile = (file) => {
    if (!file) return;
    setAssignmentFileName(file.name);
    setAssignmentFile(file);
  };

  const handleCodeFile = (file) => {
    if (!file) return;
    setCodeFileName(file.name);
    file.text().then(setUserCode).catch(() => {});
  };

  const handleEditorMount = (editor, monaco) => {
    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      setEditorHeight(contentHeight);
    };
    editor.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  const preventDragDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`app-viewport ${isCodeModalOpen ? 'has-modal-open' : ''}`}>
      {/* Sidebar Overlay & Drawer */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />
      <div className={`sidebar-drawer ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">AICO Tutor Menu</span>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>×</button>
        </div>

        <div className="sidebar-section">
          {cardData && (
            <button 
              className="sidebar-btn primary"
              onClick={() => {
                setViewMode("review");
                setIsSidebarOpen(false);
              }}
            >
              💬 Return to Conversation
            </button>
          )}

          <button 
            className="sidebar-btn"
            onClick={startNewSession}
          >
            ➕ Start New Session
          </button>

          <button 
            className="sidebar-btn"
            onClick={() => {
              setViewMode("stats");
              setIsSidebarOpen(false);
            }}
          >
            📊 View Learning Stats
          </button>
        </div>

        <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <span className="sidebar-section-title">Recent Conversations</span>
          <div className="sidebar-history-list">
            {history.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', padding: '10px 0' }}>No saved conversation history.</p>
            ) : (
              history.map(item => (
                <div 
                  key={item.id} 
                  className={`sidebar-history-item ${currentSessionId === item.id ? 'active' : ''}`}
                  onClick={() => loadSession(item)}
                  style={{ position: 'relative' }}
                >
                  <span className="sidebar-history-item-title" style={{ paddingRight: '24px' }}>{item.title}</span>
                  <span className="sidebar-history-item-date">{new Date(item.timestamp).toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(item.id);
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ff6b6b'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          {history.length > 0 && (
            <button 
              className="sidebar-delete-history-btn"
              style={{ marginTop: '12px' }}
              onClick={async () => {
                if (confirm("Are you sure you want to delete all conversation history?")) {
                  setHistory([]);
                  localStorage.removeItem("aico_chat_history");
                  startNewSession();
                  if (currentUser && currentUser.userId) {
                    try {
                      await fetch(`http://localhost:3000/api/sessions/clear/all?userId=${currentUser.userId}`, {
                        method: "DELETE"
                      });
                    } catch (err) {
                      console.error("Failed to clear sessions on server:", err);
                    }
                  }
                }
              }}
            >
              🗑️ Clear All History
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-profile">
            {!currentUser ? (
              <GoogleLogin onSuccess={handleLoginSuccess} onError={() => console.log("Login failed")} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: 12 }}>
                  <span>{currentUser.name || currentUser.email}</span>
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      localStorage.removeItem("currentUser");
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginLeft: 'auto',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 107, 107, 0.2)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Left Menu Button (Open Sidebar) */}
      <button className="menu-btn" aria-label="Open menu" onClick={() => setIsSidebarOpen(true)}>
        <span aria-hidden="true"></span>
      </button>

      {/* Top Right Stats Button */}
      {viewMode !== "stats" && (
        <button className="stats-btn" type="button" aria-label="Open statistics" onClick={() => setViewMode("stats")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 20V10M12 20V4M6 20V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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

            {cardData && (
              <div style={{ display: 'flex', gap: 10, marginTop: 15, width: '100%' }}>
                <button 
                  type="button"
                  onClick={() => setViewMode("review")}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = 0.9}
                  onMouseLeave={(e) => e.target.style.opacity = 1}
                >
                  Return to Conversation
                </button>
                <button 
                  type="button"
                  onClick={startNewSession}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#ccc',
                    cursor: 'pointer',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 107, 107, 0.15)';
                    e.target.style.color = '#ff6b6b';
                    e.target.style.borderColor = 'rgba(255, 107, 107, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                    e.target.style.color = '#ccc';
                    e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                >
                  New Session
                </button>
              </div>
            )}
          </section>
        )}

        {viewMode === "review" && (
          <div className="scroll-container review-scroll">
            <section className="cards-layout review-cards-layout">
              {pages.length > 1 && (
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn"
                    disabled={currentPageIndex === 0} 
                    onClick={() => handlePageChange(currentPageIndex - 1)}
                    aria-label="Previous page"
                  >
                    &lt;
                  </button>
                  <span className="pagination-text">Page {currentPageIndex + 1} of {pages.length}</span>
                  <button 
                    className="pagination-btn"
                    disabled={currentPageIndex === pages.length - 1} 
                    onClick={() => handlePageChange(currentPageIndex + 1)}
                    aria-label="Next page"
                  >
                    &gt;
                  </button>
                </div>
              )}
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

              <div className="figma-card full-card clickable-card" onClick={() => toggleChunk('description')}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h2 className="card-title" style={{margin: 0}}>Description</h2>
                  <span style={{color: '#a0aec0', fontSize: '14px', transition: 'transform 0.3s', transform: collapsedChunks.description ? 'rotate(-90deg)' : 'rotate(0)'}}>▼</span>
                </div>
                {!collapsedChunks.description && cardData && <div className="card-content-text" style={{marginTop: '15px'}}>{renderTextWithInlineCode(cardData.description)}</div>}
              </div>

              <div className="card-row">
                <div className="figma-card half-card clickable-card" onClick={() => toggleChunk('arguments')}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2 className="card-title" style={{margin: 0}}>Arguments</h2>
                    <span style={{color: '#a0aec0', fontSize: '14px', transition: 'transform 0.3s', transform: collapsedChunks.arguments ? 'rotate(-90deg)' : 'rotate(0)'}}>▼</span>
                  </div>
                  {!collapsedChunks.arguments && cardData && <div className="card-content-text" style={{marginTop: '15px'}}>{formatArgumentsOrReturnValues(cardData.arguments)}</div>}
                </div>
                
                <div className="figma-card half-card clickable-card" onClick={() => toggleChunk('returnValues')}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2 className="card-title" style={{margin: 0}}>Return values</h2>
                    <span style={{color: '#a0aec0', fontSize: '14px', transition: 'transform 0.3s', transform: collapsedChunks.returnValues ? 'rotate(-90deg)' : 'rotate(0)'}}>▼</span>
                  </div>
                  {!collapsedChunks.returnValues && cardData && <div className="card-content-text" style={{marginTop: '15px'}}>{formatArgumentsOrReturnValues(cardData.returnValues)}</div>}
                </div>
              </div>

              <div className="figma-card full-card clickable-card" onClick={() => toggleChunk('todo')}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h2 className="card-title" style={{margin: 0}}>TO DO</h2>
                  <span style={{color: '#a0aec0', fontSize: '14px', transition: 'transform 0.3s', transform: collapsedChunks.todo ? 'rotate(-90deg)' : 'rotate(0)'}}>▼</span>
                </div>
                {!collapsedChunks.todo && cardData && <div style={{marginTop: '15px'}}>{parseTodoText(cardData.todo)}</div>}
              </div>

              <div className="figma-card full-card clickable-card" onClick={() => toggleChunk('tips')}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h2 className="card-title" style={{margin: 0}}>Tips</h2>
                  <span style={{color: '#a0aec0', fontSize: '14px', transition: 'transform 0.3s', transform: collapsedChunks.tips ? 'rotate(-90deg)' : 'rotate(0)'}}>▼</span>
                </div>
                {!collapsedChunks.tips && cardData && <div className="card-content-text" style={{marginTop: '15px'}}>{renderTextWithInlineCode(cardData.tips)}</div>}
              </div>

              <div className="review-workspace">
                <div className="review-column">
                  <div className="figma-card user-code-card">
                    
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

                    <div 
                      className="code-editor-shell"
                      style={{ height: '100%' }}
                    >
                      <div className="editor-topbar">
                        <span></span>
                        <span></span>
                        <span></span>
                        <input
                          type="text"
                          className="filename-input"
                          value={codeFileName || assignmentFileName || "solution.jsx"}
                          onChange={(e) => setCodeFileName(e.target.value)}
                          spellCheck="false"
                        />
                      </div>
                      <div
                        className="editor-body monaco-wrapper"
                        style={{ height: 'calc(100% - 38px)', width: '100%' }}
                        onDragEnter={preventDragDefaults}
                        onDragOver={preventDragDefaults}
                        onDrop={(e) => {
                          preventDragDefaults(e);
                          handleCodeFile(e.dataTransfer.files?.[0]);
                        }}
                      >
                        <Editor
                          height="100%"
                          language={getLanguageFromFilename(codeFileName || assignmentFileName || "solution.jsx")}
                          theme="vs-dark"
                          value={userCode}
                          onChange={(value) => setUserCode(value || '')}
                          onMount={handleEditorMount}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16, bottom: 16 }
                          }}
                        />
                      </div>
                    </div>

                    <button 
                      className="primary-submit-btn" 
                      type="button" 
                      onClick={handleCodeSubmit}
                      disabled={isEvaluating}
                      style={{ opacity: isEvaluating ? 0.6 : 1, cursor: isEvaluating ? 'not-allowed' : 'pointer' }}
                    >
                      {isEvaluating ? "AI is evaluating ..." : "Submit for review"}
                    </button>
                    {evalFeedback && (
                      <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(236, 131, 187, 0.3)' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#ec83bb', fontSize: '16px', fontWeight: '600' }}>Evaluation: {evalFeedback.rating}</h3>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{evalFeedback.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="review-column">
                  <div className="figma-card reveal-card review-reveal-card">
                    
                    <button 
                      className="reveal-btn" 
                      onClick={handleReveal}
                      style={!showCode ? { backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' } : {}}
                    >
                      <span className="reveal-btn-text">
                        {showCode ? "Hide code" : "Reveal AI code"}
                      </span>
                    </button>

                    {showCode && (
                      <div className="code-content-box" style={{cursor: 'pointer', padding: 0}} onClick={() => cardData && setExpandedCard({ title: 'AI Code', content: <SyntaxHighlighter language={assignmentFileName ? (assignmentFileName.endsWith('.py') ? 'python' : 'javascript') : 'javascript'} style={vscDarkPlus} customStyle={{margin: 0, height: '100%', borderRadius: '10px'}}>{cardData.code}</SyntaxHighlighter> })}>
                        <SyntaxHighlighter language={assignmentFileName ? (assignmentFileName.endsWith('.py') ? 'python' : 'javascript') : 'javascript'} style={vscDarkPlus} customStyle={{margin: 0, height: '100%', background: 'transparent'}}>
                          {cardData ? cardData.code : "// No code generated"}
                        </SyntaxHighlighter>
                      </div>
                    )}
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
                
                <div className="compact-card-content">
                  <div className="score-card-header">
                    <h2 className="stats-title">Completions (No Reveal) this {selectedCompletionsStat.label}</h2>
                    <div className="score-range-controls" aria-label="Completions range">
                      {STATS_OPTIONS.map(option => (
                        <button
                          key={option.key}
                          type="button"
                          className={`score-range-btn ${completionsRange === option.key ? "active" : ""}`}
                          onClick={() => setCompletionsRange(option.key)}
                          aria-label={option.label}
                          aria-pressed={completionsRange === option.key}
                        >
                          {option.key}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="stats-value">{completionsCount}</div>
                  <div className={`reveal-status-text ${completionsCount >= 5 ? 'good' : completionsCount >= 2 ? 'average' : 'bad'}`}>
                    {completionsCount >= 5 ? "Excellent! You are solving tasks on your own!" : completionsCount >= 2 ? "Good job! Keep solving without code reveals." : "Try to complete more tasks without revealing code."}
                  </div>
                </div>
              </div>

              <div className="figma-card stats-card score-card">
                
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
                          className={`score-range-btn ${scoreRange === option.key ? "active" : ""}`}
                          onClick={() => setScoreRange(option.key)}
                          aria-label={option.label}
                          aria-pressed={scoreRange === option.key}
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
                        "--unacceptable": `${unacceptablePercent}%`,
                        "--poor": `${poorPercent}%`,
                        "--fair": `${fairPercent}%`,
                        "--good": `${goodPercent}%`,
                      }}
                      aria-label={`Unacceptable ${unacceptablePercent}%, Poor ${poorPercent}%, Fair ${fairPercent}%, Good ${goodPercent}%, Excellent ${excellentPercent}%`}
                    >
                      <div className="score-chart-center">
                        <span>{ratingTotal}</span>
                        <small>{selectedScoreStat.label}</small>
                      </div>
                    </div>

                    <div className="score-scale">
                      <div className="score-scale-item unacceptable">
                        <span></span>
                        <strong>{selectedRatings.unacceptable || 0}</strong>
                        <small>Unacceptable</small>
                      </div>
                      <div className="score-scale-item poor">
                        <span></span>
                        <strong>{selectedRatings.poor || 0}</strong>
                        <small>Poor</small>
                      </div>
                      <div className="score-scale-item fair">
                        <span></span>
                        <strong>{selectedRatings.fair || 0}</strong>
                        <small>Fair</small>
                      </div>
                      <div className="score-scale-item good">
                        <span></span>
                        <strong>{selectedRatings.good || 0}</strong>
                        <small>Good</small>
                      </div>
                      <div className="score-scale-item excellent">
                        <span></span>
                        <strong>{selectedRatings.excellent || 0}</strong>
                        <small>Excellent</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="figma-card stats-card bar-card">
                
                <div className="bar-card-content">
                  <div className="score-card-header">
                    <div>
                      <h2 className="score-title">No-Reveal completions history</h2>
                    </div>
                    <div className="score-range-controls" aria-label="Completions history range">
                      {STATS_OPTIONS.map(option => (
                        <button
                          key={option.key}
                          type="button"
                          className={`score-range-btn ${historyRange === option.key ? "active" : ""}`}
                          onClick={() => setHistoryRange(option.key)}
                          aria-label={option.label}
                          aria-pressed={historyRange === option.key}
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
                    <div className={`bar-chart range-${historyRange.toLowerCase()}`}>
                      {historyData.map(item => (
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

        {viewMode === "review" && (
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
                      setPendingNewAssignmentFile(file);
                    } else {
                      handleAssignmentFile(file);
                    }
                  }}
                />
              </label>

              {pendingNewAssignmentFile && (
                <div style={{color: '#ec83bb', fontSize: '13px', marginLeft: '10px', whiteSpace: 'nowrap'}}>
                  {pendingNewAssignmentFile.name}
                </div>
              )}

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

      {expandedCard && (
        <div className="modal-overlay" onClick={() => setExpandedCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setExpandedCard(null)}>×</button>
            <h2 className="modal-title">{expandedCard.title}</h2>
            <div className="modal-body">
              {expandedCard.content}
            </div>
          </div>
        </div>
      )}

      {showConfirmRevealModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmRevealModal(false)} style={{zIndex: 9999}}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px', textAlign: 'center', padding: '30px', background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px'}}>
            <h2 className="modal-title" style={{marginBottom: '15px', fontSize: '20px', fontWeight: 'bold', color: '#fff', borderBottom: 'none'}}>Reveal AI Code?</h2>
            <div className="modal-body" style={{marginBottom: '25px', color: '#a0aec0', fontSize: '15px', lineHeight: '1.5'}}>
              Are you sure you want to reveal the AI code? Try to solve it yourself first!
            </div>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
              <button 
                onClick={() => setShowConfirmRevealModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  background: 'rgba(255,255,255,0.05)', 
                  color: '#fff', 
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              >
                Cancel
              </button>
              <button 
                onClick={confirmReveal}
                style={{
                  flex: 1,
                  padding: '12px 20px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  background: '#ff4d4f', 
                  color: '#fff', 
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
                  transition: 'background 0.2s, transform 0.1s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#ff7875'}
                onMouseLeave={(e) => e.target.style.background = '#ff4d4f'}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              >
                Reveal Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
