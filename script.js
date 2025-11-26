// script.js — Medium-style dark theme shared logic (Firebase v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp, getDocs,
  doc, getDoc, updateDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// === Firebase config (your project) ===
const firebaseConfig = {
  apiKey: "AIzaSyAuQloknGaPUcMBjpD_S3vq_EiU7Bo6-5k",
  authDomain: "poultry-peoject.firebaseapp.com",
  projectId: "poultry-peoject",
  storageBucket: "poultry-peoject.appspot.com",
  messagingSenderId: "677266418055",
  appId: "1:677266418055:web:124741490b5fdd2f0c8b22"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// small DOM helpers
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const escapeHtml = s => String(s||"").replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const truncate = (s,n=260) => (String(s||"").length>n ? s.slice(0,n)+"…" : s);

// ---------- Sidebar toggle ----------
const menuBtn = $("#menuBtn");
const sidebar = $("#sidebar");
const closeBtn = $("#closeBtn");
const backdrop = $("#backdrop");

if (menuBtn && sidebar) {
  menuBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    backdrop.hidden = false;
  });
}
if (closeBtn && sidebar) {
  closeBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.hidden = true;
  });
}
if (backdrop) {
  backdrop.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.hidden = true;
  });
}

onAuthStateChanged(auth, async user => {
  const signLinks = $$(".nav-actions .btn, .nav-actions .btn-outline, .nav-actions .btn-ghost");
  const userMenu = $(".user-menu");
  const userDisplay = $("#userDisplayName");

  if (user) {
    signLinks.forEach(n => n.style.display = "none");
    if (userMenu) userMenu.style.display = "inline-block";

    // fetch username from Firestore
    try {
      const q = query(collection(db, "users"));
      const snaps = await getDocs(q);
      const userDoc = snaps.docs.find(d => d.data().uid === user.uid);
      if (userDoc && userDisplay) userDisplay.textContent = userDoc.data().username || user.email;
    } catch(e) {
      if (userDisplay) userDisplay.textContent = user.email;
      console.error(e);
    }

  } else {
    signLinks.forEach(n => n.style.display = "");
    if (userMenu) userMenu.style.display = "none";
  }
});

// MOVE SEARCH INTO DROPDOWN ON SMALL SCREENS
function relocateSearch() {
  const search = document.querySelector(".search");
  const dropdown = document.querySelector("#userDropdown");

  if (!search || !dropdown) return;

  if (window.innerWidth <= 478) {
    if (!dropdown.querySelector(".search")) {
      dropdown.insertBefore(search, dropdown.children[1]); 
    }
  } else {
    const navRight = document.querySelector(".nav-right");
    if (navRight && !navRight.querySelector(".search")) {
      navRight.insertBefore(search, navRight.children[0]);
    }
  }
}

// run on load + resize
relocateSearch();
window.addEventListener("resize", relocateSearch);


// Toggle dropdown
const userBtn = $("#userBtn");
const userDropdown = $("#userDropdown");
if (userBtn && userDropdown) {
  userBtn.addEventListener("click", e => {
    e.stopPropagation();
    userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", () => {
    userDropdown.style.display = "none";
  });
}





// ---------- Signup ----------
const signupForm = $("#signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = $("#signupUsername").value.trim();
    const email = $("#signupEmail").value.trim();
    const pass = $("#signupPassword").value;
    const msg = $("#signupMsg");

    if (!username || !email || !pass) {
      msg.textContent = "All fields are required";
      msg.style.color = "#ff9b9b";
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;

      // Save username to Firestore
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        username,
        email,
        createdAt: serverTimestamp()
      });

      msg.textContent = "Account created — redirecting…";
      msg.style.color = "#9be7a8";
      setTimeout(() => location.href = "../index.html", 900);
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "#ff9b9b";
    }
  });
}


// ---------- Login ----------
const loginForm = $("#loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#loginEmail").value;
    const pass = $("#loginPassword").value;
    const msg = $("#loginMsg");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      msg.textContent = "Signed in — redirecting…";
      msg.style.color = "#9be7a8";
      setTimeout(()=> location.href = "../index.html", 700);
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "#ff9b9b";
    }
  });
}

// ---------- Publish Post (addblog.html) ----------
const blogForm = $("#blogForm");
if (blogForm) {
  blogForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("#title").value.trim();
    const subtitle = $("#subtitle") ? $("#subtitle").value.trim() : "";
    const description = $("#description").value.trim();
    const message = $("#message");
    if (!title || !description) {
      if (message) { message.textContent = "Title and content are required."; message.style.color = "#ff9b9b"; }
      return;
    }
    try {
      await addDoc(collection(db, "blogs"), { title, subtitle, description, createdAt: serverTimestamp(), likes: [] });
      if (message) { message.textContent = "Published — redirecting…"; message.style.color = "#9be7a8"; }
      blogForm.reset();
      setTimeout(()=> window.location.href = "../index.html", 900);
    } catch (err) {
      if (message) { message.textContent = err.message; message.style.color = "#ff9b9b"; }
    }
  });
}

// ---------- Load articles for homepage ----------
const articlesList = $("#articlesList");
const searchInput = $("#searchInput");

async function loadArticles(searchTerm = "") {
  if (!articlesList) return;
  articlesList.innerHTML = `<div class="loading muted">Loading posts…</div>`;
  try {
    const snaps = await getDocs(collection(db, "blogs"));
    const arr = [];
    snaps.forEach(s => arr.push({ id: s.id, ...s.data() }));
    // sort desc
    arr.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
    // filter
    const filtered = searchTerm ? arr.filter(p => (p.title||"").toLowerCase().includes(searchTerm) || (p.description||"").toLowerCase().includes(searchTerm)) : arr;
    if (!filtered.length) { articlesList.innerHTML = `<div class="center muted">No posts found.</div>`; return; }
    // render
    articlesList.innerHTML = "";
    for (const post of filtered) {
      const el = document.createElement("article");
      el.className = "article card";
      el.innerHTML = `
  <h2>${escapeHtml(post.title)}</h2>
  ${post.subtitle ? `<p class="muted">${escapeHtml(post.subtitle)}</p>` : ""}
  <p>${escapeHtml(truncate(post.description, 320))}</p>

  <div class="meta muted">
    ${post.createdAt ? new Date(post.createdAt.seconds*1000).toLocaleDateString() : ""} • 
    <span id="likes-${post.id}">${(post.likes||[]).length}</span> likes
  </div>

  <div class="post-actions" style="margin-top:12px; display:flex; gap:10px; align-items:center;">
    <button class="like-btn" data-id="${post.id}">
      <svg class="heart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      Like
    </button>
    <a class="read-link" href="Otherhtml/viewblog.html?id=${post.id}">Read →</a>
  </div>
`;
articlesList.addEventListener("click", async e => {
  const btn = e.target.closest(".like-btn");
  if (!btn) return;
  const postId = btn.dataset.id;
  const user = auth.currentUser;
  if (!user) return alert("Sign in to like posts.");

  try {
    const docRef = doc(db, "blogs", postId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const likes = data.likes || [];
    const userIndex = likes.indexOf(user.uid);

    if (userIndex === -1) likes.push(user.uid); // add like
    else likes.splice(userIndex, 1); // unlike

    await updateDoc(docRef, { likes });
    document.querySelector(`#likes-${postId}`).textContent = likes.length;

    // Optional: toggle active style
    btn.classList.toggle("liked", userIndex === -1);
  } catch(err) {
    console.error(err);
    alert("Failed to update likes.");
  }
});


      articlesList.appendChild(el);
    }
  } catch (err) {
    console.error(err);
    articlesList.innerHTML = `<div class="center muted">Failed to load posts.</div>`;
  }
}
if (articlesList) loadArticles();
if (searchInput) {
  let t;
  searchInput.addEventListener("input", e => {
    clearTimeout(t);
    t = setTimeout(()=> loadArticles((e.target.value||"").toLowerCase().trim()), 300);
  });
}

// ---------- View single article (viewblog.html) ----------
const articleContainer = $("#articleContainer");
const commentForm = $("#commentForm");
const commentsList = $("#commentsList");

async function loadSingleArticle() {
  if (!articleContainer) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;
  articleContainer.innerHTML = `<p class="muted">Loading article…</p>`;
  try {
    const docRef = doc(db, "blogs", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) { articleContainer.innerHTML = `<p>Article not found.</p>`; return; }
    const data = snap.data();
    articleContainer.innerHTML = `
      <h1>${escapeHtml(data.title)}</h1>
      ${data.subtitle ? `<p class="subtitle muted">${escapeHtml(data.subtitle)}</p>` : ""}
      <div class="content">${escapeHtml(data.description).replace(/\n/g,"<br><br>")}</div>
      <div style="margin-top:12px;color:var(--muted)">${data.createdAt ? new Date(data.createdAt.seconds*1000).toLocaleString() : ""}</div>
    `;

    // load comments (simple)
    if (commentsList) {
      commentsList.innerHTML = "";
      const commentsCol = collection(db, "blogs", id, "comments");
      const q = query(commentsCol, orderBy("createdAt", "asc"));
      const snapComments = await getDocs(q);
      if (snapComments.empty) commentsList.innerHTML = `<div class="muted">No comments yet</div>`;
      snapComments.forEach(c => {
        const cd = c.data();
        const d = document.createElement("div");
        d.className = "comment";
        d.innerHTML = `<div class="meta muted">${escapeHtml(cd.userEmail || "Anonymous")} • ${cd.createdAt ? new Date(cd.createdAt.seconds*1000).toLocaleString() : ""}</div><div>${escapeHtml(cd.text)}</div>`;
        commentsList.appendChild(d);
      });
    }

  } catch (err) {
    console.error(err);
    articleContainer.innerHTML = `<p>Failed to load article.</p>`;
  }
}
if (articleContainer) loadSingleArticle();

// ---------- Post comment ----------
if (commentForm) {
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = $("#commentText").value.trim();
    if (!text) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return alert("Invalid article.");
    const user = auth.currentUser;
    if (!user) return alert("Please sign in to comment.");
    try {
      await addDoc(collection(db, "blogs", id, "comments"), { text, userEmail: user.email, createdAt: serverTimestamp() });
      $("#commentText").value = "";
      loadSingleArticle();
    } catch (err) {
      console.error(err); alert("Failed to post comment.");
    }
  });
}

// ---------- Sidebar subscribe ----------
const sidebarSubscribe = $("#sidebarSubscribe");
if (sidebarSubscribe) {
  sidebarSubscribe.addEventListener("click", () => {
    const em = $("#sidebarEmail").value || "";
    if (!em) return alert("Enter email");
    alert(`Subscribed: ${em} (demo)`);
    $("#sidebarEmail").value = "";
  });
}

// ---------- Simple logout if you add a logout button later ----------
const logoutBtn = $("#logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "../index.html";
  });
}
