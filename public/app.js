// ✅ Firebase対応のToDoアプリ + メールログイン機能付き（完全統合版）

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// 🔹 ログイン関連DOM取得
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const todoContainer = document.getElementById("todo-container");

let currentUser = null;

signupBtn.addEventListener("click", () => {
  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => alert("登録完了！ログインしてください"))
    .catch(e => alert(e.message));
});

loginBtn.addEventListener("click", (e) => {
  e.preventDefault(); // ページ再読み込み防止
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      console.log("ログイン成功");
    })
    .catch((e) => {
      console.error(e);
      alert("ログインに失敗しました: " + e.message);
    });
});


logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

const authContainer = document.getElementById("auth-container");
const logoutContainer = document.getElementById("logout-container");

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    todoContainer.style.display = "block";
    authContainer.style.display = "none";
    logoutContainer.style.display = "block"; // ✅ ログアウトボタン表示
    loadTodosFromCloud();
  } else {
    currentUser = null;
    todoContainer.style.display = "none";
    authContainer.style.display = "block";
    logoutContainer.style.display = "none"; // ✅ ログアウトボタン非表示
  }
});


// 🔹 ToDoリスト機能
const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");
const deadlineInput = document.getElementById("todo-deadline");
const prioritySelect = document.getElementById("todo-priority");
const sortSelect = document.getElementById("sort-select");
const filterSelect = document.getElementById("filter-select");

const modal = document.getElementById("edit-modal");
const editText = document.getElementById("edit-text");
const editDeadline = document.getElementById("edit-deadline");
const editPriority = document.getElementById("edit-priority");
const saveEditBtn = document.getElementById("save-edit");
const cancelEditBtn = document.getElementById("cancel-edit");

let currentEditIndex = null;
let todos = [];

function getPriorityValue(priority) {
  if (priority === "高") return 3;
  if (priority === "中") return 2;
  return 1;
}

async function saveTodosToCloud() {
  if (!currentUser) return;
  await setDoc(doc(db, "todos", currentUser.uid), {
    data: todos
  });
}

async function loadTodosFromCloud() {
  if (!currentUser) return;
  const docRef = doc(db, "todos", currentUser.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    todos = docSnap.data().data;
  } else {
    todos = [];
  }
  renderTodos();
}

function renderTodos() {
  list.innerHTML = "";
  let sortedTodos = [...todos];

  const sortType = sortSelect.value;
  if (sortType === "deadline") {
    sortedTodos.sort((a, b) => new Date(a.deadline || "9999-12-31") - new Date(b.deadline || "9999-12-31"));
  } else if (sortType === "priority") {
    sortedTodos.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
  }

  const filter = filterSelect.value;
  if (filter === "done") {
    sortedTodos = sortedTodos.filter(todo => todo.done);
  } else if (filter === "not-done") {
    sortedTodos = sortedTodos.filter(todo => !todo.done);
  }

  sortedTodos.forEach((todo) => {
    const li = document.createElement("li");

    if (todo.done) li.classList.add("done");
    if (todo.priority === "高") li.classList.add("priority-high");
    else if (todo.priority === "中") li.classList.add("priority-medium");
    else li.classList.add("priority-low");

    const row = document.createElement("div");
    row.className = "todo-row";

    const text = document.createElement("span");
    text.textContent = `${todo.text}（締切: ${todo.deadline} | 優先度: ${todo.priority}）`;

    li.addEventListener("click", () => {
      const index = todos.findIndex(t => t === todo);
      todos[index].done = !todos[index].done;
      saveTodosToCloud();
      renderTodos();
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "編集";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = todos.findIndex(t => t === todo);
      currentEditIndex = index;
      editText.value = todo.text;
      editDeadline.value = todo.deadline;
      editPriority.value = todo.priority;
      modal.style.display = "block";
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = todos.findIndex(t => t === todo);
      todos.splice(index, 1);
      saveTodosToCloud();
      renderTodos();
    });

    row.appendChild(text);
    row.appendChild(editBtn);
    row.appendChild(deleteBtn);
    li.appendChild(row);
    list.appendChild(li);
  });
}

saveEditBtn.addEventListener("click", () => {
  if (currentEditIndex !== null) {
    todos[currentEditIndex].text = editText.value;
    todos[currentEditIndex].deadline = editDeadline.value;
    todos[currentEditIndex].priority = editPriority.value;
    saveTodosToCloud();
    renderTodos();
    modal.style.display = "none";
    currentEditIndex = null;
  }
});

cancelEditBtn.addEventListener("click", () => {
  modal.style.display = "none";
  currentEditIndex = null;
});

addBtn.addEventListener("click", () => {
  const text = input.value.trim();
  const deadline = deadlineInput.value;
  const priority = prioritySelect.value;
  if (text === "") return;
  todos.push({ text, deadline: deadline || "なし", priority, done: false });
  saveTodosToCloud();
  renderTodos();
  input.value = "";
  deadlineInput.value = "";
  prioritySelect.value = "中";
});

sortSelect.addEventListener("change", renderTodos);
filterSelect.addEventListener("change", renderTodos);
