import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { useState } from 'react'", "import { useState, useEffect } from 'react'\nimport { GoogleLogin } from '@react-oauth/google'\nimport { jwtDecode } from 'jwt-decode'")

# 2. State variables
content = content.replace('  const [expandedCard, setExpandedCard] = useState(null);', '''  const [expandedCard, setExpandedCard] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [evalFeedback, setEvalFeedback] = useState(null);

  useEffect(() => {
    if (viewMode === "stats" && currentUser) {
      fetch(`http://localhost:3000/api/stats?userId=${currentUser.userId}&range=${statsRange}`)
        .then(res => res.json())
        .then(data => setStatsData(data))
        .catch(console.error);
    }
  }, [viewMode, statsRange, currentUser]);
  
  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      setCurrentUser(data);
    } catch (e) {
      const decoded = jwtDecode(credentialResponse.credential);
      setCurrentUser({ userId: "mock-id-123", name: decoded.name, picture: decoded.picture });
    }
  };''')

# 3. Stats calculation
old_stats_calc = """  const selectedStat = STATS_OPTIONS.find(option => option.key === statsRange) ?? STATS_OPTIONS[0];
  const selectedRatings = SCORE_RATINGS[statsRange];
  const ratingTotal = selectedRatings.red + selectedRatings.yellow + selectedRatings.green;
  const redPercent = Math.round((selectedRatings.red / ratingTotal) * 100);
  const yellowPercent = Math.round((selectedRatings.yellow / ratingTotal) * 100);
  const greenPercent = 100 - redPercent - yellowPercent;
  const selectedHistory = REVEAL_HISTORY[statsRange];
  const maxHistoryValue = Math.max(...selectedHistory.map(item => item.value));"""

new_stats_calc = """  const selectedStat = STATS_OPTIONS.find(option => option.key === statsRange) ?? STATS_OPTIONS[0];
  const selectedRatings = statsData ? statsData.scoreRatings : { red: 0, yellow: 0, green: 0 };
  const ratingTotal = selectedRatings.red + selectedRatings.yellow + selectedRatings.green;
  const redPercent = ratingTotal ? Math.round((selectedRatings.red / ratingTotal) * 100) : 0;
  const yellowPercent = ratingTotal ? Math.round((selectedRatings.yellow / ratingTotal) * 100) : 0;
  const greenPercent = ratingTotal ? 100 - redPercent - yellowPercent : 0;
  const selectedHistory = statsData?.history || [];
  const maxHistoryValue = selectedHistory.length > 0 ? Math.max(...selectedHistory.map(item => item.value)) : 10;
  const totalReveals = statsData?.totalReveals || 0;"""

content = content.replace(old_stats_calc, new_stats_calc)

# 4. handleCodeSubmit
old_submit = """  const handleCodeSubmit = () => {
    if (!userCode.trim()) return;
  };"""

new_submit = """  const handleCodeSubmit = async () => {
    if (!userCode.trim()) return;
    if (!currentUser) return alert("Please login first to submit code.");
    try {
      const res = await fetch("http://localhost:3000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.userId, code: userCode, taskDescription })
      });
      const data = await res.json();
      setEvalFeedback(data);
      setExpandedCard({ title: `Evaluation: ${data.rating}`, content: <p>{data.feedback}</p> });
    } catch (e) { console.error(e); }
  };
  
  const handleReveal = async () => {
    setShowCode(!showCode);
    if (!showCode && currentUser) {
      try {
        await fetch("http://localhost:3000/api/reveal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.userId })
        });
      } catch (e) { console.error(e); }
    }
  };"""

content = content.replace(old_submit, new_submit)

# 5. JSX - Reveal Button
content = content.replace('<button className="reveal-btn" onClick={() => setShowCode(!showCode)}>', '<button className="reveal-btn" onClick={handleReveal}>')

# 6. JSX - Total Reveals
content = content.replace('<div className="stats-value">{selectedStat.value}</div>', '<div className="stats-value">{totalReveals}</div>')

# 7. JSX - Google Login UI
login_ui = """      <div style={{ position: 'absolute', top: 32, right: 230, zIndex: 120 }}>
        {!currentUser ? (
          <GoogleLogin onSuccess={handleLoginSuccess} onError={() => console.log("Login failed")} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: 20 }}>
            {currentUser.picture && <img src={currentUser.picture} alt="" style={{width: 24, borderRadius: '50%'}}/>}
            <span>{currentUser.name || currentUser.email}</span>
          </div>
        )}
      </div>"""

content = content.replace('<div className="content-layout">', f'{login_ui}\\n      <div className="content-layout">')

with open('src/App.jsx', 'w') as f:
    f.write(content)
print("App.jsx updated with auth and endpoints")
