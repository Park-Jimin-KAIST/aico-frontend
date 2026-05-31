css = """
/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(14, 15, 46, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out forwards;
}

.modal-content {
  background: radial-gradient(circle at 18% 10%, rgba(236, 131, 187, 0.16), transparent 34%), linear-gradient(145deg, rgba(28, 31, 40, 0.95), rgba(14, 15, 46, 0.85));
  border: 1px solid #cad6e8;
  border-radius: 20px;
  box-shadow: 0px 4px 30px rgba(91, 71, 188, 0.6);
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 40px;
  position: relative;
}

.modal-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  color: #cad6e8;
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
}

.modal-close-btn:hover {
  color: #ec83bb;
}

.modal-title {
  font-family: 'Poppins', sans-serif;
  font-size: 36px;
  color: #ffffff;
  margin-bottom: 20px;
  padding-right: 40px;
}

.modal-body {
  overflow-y: auto;
  font-family: 'Inter', sans-serif;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  line-height: 1.6;
  padding-right: 10px;
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}
.modal-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
.modal-body::-webkit-scrollbar-thumb {
  background: rgba(236, 131, 187, 0.3);
  border-radius: 4px;
}
.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(236, 131, 187, 0.5);
}

.clickable-card {
  cursor: pointer;
}

.todo-list {
  padding-left: 0px;
  margin-top: 10px;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.9);
}

.todo-list-item {
  margin-bottom: 12px;
  background: rgba(236, 131, 187, 0.1);
  border-left: 4px solid rgba(236, 131, 187, 0.6);
  padding: 10px 15px;
  border-radius: 4px;
  list-style-type: none;
}
"""
with open('src/index.css', 'a') as f:
    f.write(css)
print("CSS appended.")
