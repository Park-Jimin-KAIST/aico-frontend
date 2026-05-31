import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. Remove all <img src={imgExample2} className="card-texture" alt="" />
content = content.replace('<img src={imgExample2} className="card-texture" alt="" />', '')

# 2. Replace the cards with clickable-card and use parseTodoText
cards_old = """              <div className="figma-card full-card">
                
                <h2 className="card-title">Description</h2>
                {cardData && <p className="card-content-text">{cardData.description}</p>}
              </div>

              <div className="card-row">
                <div className="figma-card half-card">
                  
                  <h2 className="card-title">Arguments</h2>
                  {cardData && <p className="card-content-text">{cardData.arguments}</p>}
                </div>
                
                <div className="figma-card half-card">
                  
                  <h2 className="card-title">Return values</h2>
                  {cardData && <p className="card-content-text">{cardData.returnValues}</p>}
                </div>
              </div>

              <div className="figma-card full-card">
                
                <h2 className="card-title">TO DO</h2>
                {cardData && <p className="card-content-text">{cardData.todo}</p>}
              </div>

              <div className="figma-card full-card">
                
                <h2 className="card-title">Tips</h2>
                {cardData && <p className="card-content-text">{cardData.tips}</p>}
              </div>"""

cards_new = """              <div className="figma-card full-card clickable-card" onClick={() => cardData && setExpandedCard({ title: 'Description', content: <p className="card-content-text">{cardData.description}</p> })}>
                <h2 className="card-title">Description</h2>
                {cardData && <p className="card-content-text">{cardData.description}</p>}
              </div>

              <div className="card-row">
                <div className="figma-card half-card clickable-card" onClick={() => cardData && setExpandedCard({ title: 'Arguments', content: <p className="card-content-text">{cardData.arguments}</p> })}>
                  <h2 className="card-title">Arguments</h2>
                  {cardData && <p className="card-content-text">{cardData.arguments}</p>}
                </div>
                
                <div className="figma-card half-card clickable-card" onClick={() => cardData && setExpandedCard({ title: 'Return values', content: <p className="card-content-text">{cardData.returnValues}</p> })}>
                  <h2 className="card-title">Return values</h2>
                  {cardData && <p className="card-content-text">{cardData.returnValues}</p>}
                </div>
              </div>

              <div className="figma-card full-card clickable-card" onClick={() => cardData && setExpandedCard({ title: 'TO DO', content: parseTodoText(cardData.todo) })}>
                <h2 className="card-title">TO DO</h2>
                {cardData && parseTodoText(cardData.todo)}
              </div>

              <div className="figma-card full-card clickable-card" onClick={() => cardData && setExpandedCard({ title: 'Tips', content: <p className="card-content-text">{cardData.tips}</p> })}>
                <h2 className="card-title">Tips</h2>
                {cardData && <p className="card-content-text">{cardData.tips}</p>}
              </div>"""

# Handle empty lines left by removal
content = re.sub(r' +<img src=\{imgExample2\} className="card-texture" alt="" />\n?', '', content)

# Now we replace the block without the img tags
content = re.sub(r' +<div className="figma-card full-card">\s*<h2 className="card-title">Description</h2>\s*\{cardData && <p className="card-content-text">\{cardData.description\}</p>\}\s*</div>\s*<div className="card-row">\s*<div className="figma-card half-card">\s*<h2 className="card-title">Arguments</h2>\s*\{cardData && <p className="card-content-text">\{cardData.arguments\}</p>\}\s*</div>\s*<div className="figma-card half-card">\s*<h2 className="card-title">Return values</h2>\s*\{cardData && <p className="card-content-text">\{cardData.returnValues\}</p>\}\s*</div>\s*</div>\s*<div className="figma-card full-card">\s*<h2 className="card-title">TO DO</h2>\s*\{cardData && <p className="card-content-text">\{cardData.todo\}</p>\}\s*</div>\s*<div className="figma-card full-card">\s*<h2 className="card-title">Tips</h2>\s*\{cardData && <p className="card-content-text">\{cardData.tips\}</p>\}\s*</div>', cards_new, content)

with open('src/App.jsx', 'w') as f:
    f.write(content)
print("Done modifying App.jsx")
