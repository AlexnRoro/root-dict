// 词根数据库
let wordDatabase = {};

// 从JSON文件加载词典
fetch('./dictionary.json')
    .then(res => res.json())
    .then(data => {
        wordDatabase = data;
        console.log(`词典加载成功: ${Object.keys(wordDatabase).length} 个单词`);
    })
    .catch(err => {
        console.error('词典加载失败:', err);
        // 使用内置备用数据
        wordDatabase = {
            "example": {
                word: "example",
                roots: [
                    { root: "ex-", meaning: "出，外" },
                    { root: "empl", meaning: "拿，取" }
                ]
            }
        };
    });

function searchWord(word) {
    return wordDatabase[word];
}

// 本地存储管理
const Storage = {
    getFavorites() {
        const data = localStorage.getItem('favorites');
        return data ? JSON.parse(data) : [];
    },
    saveFavorites(favorites) {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    },
    addFavorite(word) {
        const favorites = this.getFavorites();
        if (!favorites.includes(word)) {
            favorites.push(word);
            this.saveFavorites(favorites);
        }
    },
    removeFavorite(word) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(w => w !== word);
        this.saveFavorites(filtered);
    },
    isFavorite(word) {
        return this.getFavorites().includes(word);
    }
};

// 当前显示的单词
let currentWord = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSearch();
    renderFavorites();
    registerServiceWorker();
});

// 导航切换
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            if (tabName === 'favorites') {
                renderFavorites();
            }
        });
    });
}

// 搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    searchBtn.addEventListener('click', () => search());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') search();
    });
}

function search() {
    const input = document.getElementById('searchInput');
    const word = input.value.trim().toLowerCase();
    
    if (!word) return;
    
    console.log('搜索单词:', word);
    const result = searchWord(word);
    console.log('搜索结果:', result);
    displayResult(result, word);
}

function displayResult(data, word) {
    const resultDiv = document.getElementById('result');
    
    if (!data) {
        resultDiv.innerHTML = `
            <div class="no-result">
                未找到单词 "${word}" 的词根信息
            </div>
        `;
        currentWord = null;
        return;
    }
    
    currentWord = word;
    const isFav = Storage.isFavorite(word);
    
    console.log('显示结果 - 词根数量:', data.roots ? data.roots.length : 0);
    console.log('词根详情:', data.roots);
    
    resultDiv.innerHTML = `
        <div class="word-card">
            <div class="word-header">
                <div class="word-title">${data.word}</div>
                <button class="favorite-btn" onclick="toggleFavorite()">
                    ${isFav ? '⭐' : '☆'}
                </button>
            </div>
            <div class="roots">
                <div class="roots-title">词根分析：</div>
                ${data.roots && data.roots.length > 0 ? data.roots.map(r => `
                    <div class="root-item">
                        <div class="root-name">${r.root}</div>
                        <div class="root-meaning">${r.meaning}</div>
                    </div>
                `).join('') : '<div>无词根信息</div>'}
            </div>
        </div>
    `;
}

// 收藏功能
function toggleFavorite() {
    if (!currentWord) return;
    
    if (Storage.isFavorite(currentWord)) {
        Storage.removeFavorite(currentWord);
    } else {
        Storage.addFavorite(currentWord);
    }
    
    // 重新显示结果以更新星标
    const data = wordDatabase[currentWord];
    displayResult(data, currentWord);
}

// 渲染收藏夹
function renderFavorites() {
    const listDiv = document.getElementById('favoritesList');
    const favorites = Storage.getFavorites();
    
    if (favorites.length === 0) {
        listDiv.innerHTML = '<div class="empty-favorites">还没有收藏任何单词</div>';
        return;
    }
    
    listDiv.innerHTML = favorites.map(word => {
        const data = wordDatabase[word];
        if (!data) {
            return `
                <div class="favorite-item">
                    <div class="favorite-word" onclick="viewWord('${word}')">${word}</div>
                    <button class="delete-btn" onclick="deleteFavorite('${word}')">删除</button>
                </div>
            `;
        }
        
        return `
            <div class="favorite-item-detailed">
                <div class="favorite-header">
                    <div class="favorite-word" onclick="viewWord('${word}')">${word}</div>
                    <button class="delete-btn" onclick="deleteFavorite('${word}')">删除</button>
                </div>
                ${data.gloss ? `<div class="favorite-gloss">${data.gloss}</div>` : ''}
                ${data.roots && data.roots.length > 0 ? `
                    <div class="favorite-roots">
                        ${data.roots.map(r => `
                            <span class="favorite-root">${r.root} (${r.meaning})</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function viewWord(word) {
    // 切换到查词页面
    document.querySelector('[data-tab="search"]').click();
    
    // 填充搜索框并搜索
    document.getElementById('searchInput').value = word;
    search();
}

function deleteFavorite(word) {
    Storage.removeFavorite(word);
    renderFavorites();
}

// 注册 Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
}
