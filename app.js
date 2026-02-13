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
    
    if (result) {
        displayResult(result, word);
    } else {
        // 本地词典没有，尝试在线API
        searchOnline(word);
    }
}

// 词根分析器 - 使用增强版本
const RootAnalyzer = {
    analyze(word) {
        // 如果增强分析器可用，使用它
        if (typeof EnhancedRootAnalyzer !== 'undefined') {
            return EnhancedRootAnalyzer.analyze(word);
        }
        
        // 否则使用基础分析器
        return this.basicAnalyze(word);
    },
    
    basicAnalyze(word) {
        const prefixes = {
            'un-': '不，非', 're-': '再，重新', 'pre-': '预先，在前', 'dis-': '不，分离',
            'mis-': '错误，坏', 'over-': '过度，在上', 'under-': '在下，不足', 'out-': '超过，向外',
            'in-': '在内，向内', 'ex-': '向外，前任', 'sub-': '在下，次', 'super-': '超级，在上',
            'inter-': '在...之间', 'trans-': '穿过，转换', 'anti-': '反对，抗', 'pro-': '支持，向前',
            'con-': '共同，一起', 'de-': '去除，向下', 'auto-': '自动，自己', 'semi-': '半',
            'multi-': '多', 'mono-': '单一', 'bi-': '二，双', 'tri-': '三', 'micro-': '微小',
            'macro-': '宏大', 'mini-': '小', 'neo-': '新', 'ab-': '离开，脱离', 'ad-': '向，朝',
            'com-': '共同', 'im-': '向内，不', 'non-': '不，非'
        };
        
        const suffixes = {
            '-tion': '名词后缀', '-sion': '名词后缀', '-ment': '名词后缀', '-ness': '名词后缀',
            '-ity': '名词后缀', '-ism': '名词后缀', '-ist': '表示人', '-er': '表示人或物',
            '-or': '表示人或物', '-able': '能够的', '-ible': '能够的', '-ful': '充满的',
            '-less': '没有的', '-ous': '具有...性质', '-ic': '...的', '-al': '...的',
            '-ive': '有...倾向', '-ly': '副词后缀', '-ize': '使成为', '-ate': '动词/形容词后缀',
            '-ed': '过去式/形容词', '-ing': '进行时/名词', '-ent': '形容词后缀', '-ant': '形容词后缀'
        };
        
        const roots = {
            'act': '做，行动', 'aud': '听', 'bio': '生命', 'cap': '拿，抓', 'ced': '走',
            'cept': '拿，抓', 'dict': '说', 'duc': '引导', 'fac': '做', 'fer': '带来',
            'form': '形状', 'gen': '产生', 'graph': '写', 'ject': '投掷', 'lect': '选择',
            'log': '说话', 'man': '手', 'mit': '送', 'mov': '移动', 'port': '带来',
            'pos': '放置', 'press': '压', 'script': '写', 'sect': '切', 'spect': '看',
            'struct': '建造', 'tact': '接触', 'ten': '拿，持', 'tract': '拉', 'ven': '来',
            'vers': '转', 'vid': '看', 'vis': '看', 'voc': '声音', 'solut': '松开，解开',
            'solv': '松开，解开', 'lut': '松开', 'lute': '绝对', 'put': '思考', 'comput': '计算',
            'beaut': '美丽', 'ful': '充满', 'aut': '自己', 'tom': '切割', 'mat': '移动，思考'
        };
        
        const components = [];
        let remaining = word.toLowerCase();
        
        // 查找前缀
        for (const [prefix, meaning] of Object.entries(prefixes)) {
            const prefixClean = prefix.replace('-', '');
            if (remaining.startsWith(prefixClean) && remaining.length > prefixClean.length) {
                components.push({ root: prefix, meaning });
                remaining = remaining.substring(prefixClean.length);
                break;
            }
        }
        
        // 查找后缀
        let suffixFound = null;
        for (const [suffix, meaning] of Object.entries(suffixes)) {
            const suffixClean = suffix.replace('-', '');
            if (remaining.endsWith(suffixClean) && remaining.length > suffixClean.length) {
                suffixFound = { root: suffix, meaning };
                remaining = remaining.substring(0, remaining.length - suffixClean.length);
                break;
            }
        }
        
        // 查找词根
        if (remaining) {
            let bestMatch = null;
            let bestLength = 0;
            
            for (const [root, meaning] of Object.entries(roots)) {
                if (remaining.includes(root) && root.length > bestLength) {
                    bestMatch = { root, meaning };
                    bestLength = root.length;
                }
            }
            
            if (bestMatch) {
                components.push(bestMatch);
                const remainingParts = remaining.replace(bestMatch.root, '');
                if (remainingParts) {
                    components.push({ root: remainingParts, meaning: '词根' });
                }
            } else {
                components.push({ root: remaining, meaning: '词根' });
            }
        }
        
        if (suffixFound) {
            components.push(suffixFound);
        }
        
        return components;
    }
};

// 增强的在线查词
async function searchOnline(word) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div class="loading">正在智能查询...</div>';
    
    try {
        // 使用增强的词典API
        const result = await enhancedDict.searchMultipleAPIs(word);
        
        if (result) {
            const displayData = {
                word: result.word,
                gloss: result.definitions.join(' | '),
                phonetic: result.phonetic,
                roots: result.roots,
                isOnline: true,
                source: result.source
            };
            
            displayResult(displayData, word);
            
            // 自动学习：将新词添加到本地词典
            if (!wordDatabase[word]) {
                wordDatabase[word] = {
                    word: word,
                    gloss: displayData.gloss,
                    roots: displayData.roots
                };
                console.log(`已学习新词: ${word}`);
            }
        } else {
            // 完全失败时的备选方案
            const roots = enhancedDict.analyzeWordRoots(word);
            const displayData = {
                word: word,
                gloss: '未找到释义，仅提供词根分析',
                roots: roots,
                isOnline: true,
                source: 'root_only'
            };
            displayResult(displayData, word);
        }
        
    } catch (error) {
        console.error('智能查询失败:', error);
        // 最后的备选方案
        const roots = enhancedDict.analyzeWordRoots(word);
        const displayData = {
            word: word,
            gloss: '网络查询失败，仅提供词根分析',
            roots: roots,
            isOnline: true,
            source: 'offline_analysis'
        };
        displayResult(displayData, word);
    }
}

function displayResult(data, word) {
    const resultDiv = document.getElementById('result');
    
    if (!data) {
        resultDiv.innerHTML = `
            <div class="no-result">
                未找到单词 "${word}" 的信息
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
                <div>
                    <div class="word-title">${data.word}</div>
                    ${data.phonetic ? `<div class="word-phonetic">[${data.phonetic}]</div>` : ''}
                    ${data.gloss ? `<div class="word-gloss">${data.gloss}</div>` : ''}
                    <div class="badges">
                        ${data.isOnline ? '<span class="online-badge">在线查询</span>' : '<span class="local-badge">本地词典</span>'}
                        ${data.source ? `<span class="source-badge">${getSourceLabel(data.source)}</span>` : ''}
                    </div>
                </div>
                <button class="favorite-btn" onclick="toggleFavorite()">
                    ${isFav ? '⭐' : '☆'}
                </button>
            </div>
            ${data.roots && data.roots.length > 0 ? `
                <div class="roots">
                    <div class="roots-title">词根分析：</div>
                    ${data.roots.map((r, index) => `
                        <div class="root-item" data-index="${index}">
                            <div class="root-name">${r.root}</div>
                            <div class="root-meaning">${r.meaning}</div>
                            <button class="edit-root-btn" onclick="editRoot('${word}', ${index}, '${r.root}', '${r.meaning}')" title="修正词根">✏️</button>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="word-actions">
                <button onclick="showLearningStats()" class="stats-btn">学习统计</button>
                <button onclick="findSimilarWords('${word}')" class="similar-btn">相似词汇</button>
            </div>
        </div>
    `;
}

// 获取数据源标签
function getSourceLabel(source) {
    const labels = {
        'free_dict': '词典API',
        'root_analysis': '词根分析',
        'root_only': '仅词根',
        'offline_analysis': '离线分析'
    };
    return labels[source] || source;
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

// 导出收藏
function exportFavorites() {
    const favorites = Storage.getFavorites();
    const data = JSON.stringify(favorites, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favorites.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 导入收藏
function importFavorites(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const favorites = JSON.parse(e.target.result);
            if (Array.isArray(favorites)) {
                Storage.saveFavorites(favorites);
                renderFavorites();
                alert('导入成功！');
            } else {
                alert('文件格式错误');
            }
        } catch (err) {
            alert('导入失败：' + err.message);
        }
    };
    reader.readAsText(file);
}

// 编辑词根功能
function editRoot(word, rootIndex, currentRoot, currentMeaning) {
    const newRoot = prompt('请输入正确的词根:', currentRoot);
    if (newRoot === null) return;
    
    const newMeaning = prompt('请输入词根含义:', currentMeaning);
    if (newMeaning === null) return;
    
    // 使用增强词典的修正功能
    enhancedDict.correctRoot(word, rootIndex, newRoot, newMeaning);
    
    // 重新搜索显示
    search();
    
    alert('词根修正已保存，将用于改进未来的分析！');
}

// 显示学习统计
function showLearningStats() {
    const stats = enhancedDict.getLearningStats();
    
    const statsHtml = `
        <div class="stats-modal">
            <div class="stats-content">
                <h3>学习统计</h3>
                <div class="stat-item">
                    <span class="stat-label">总查询次数:</span>
                    <span class="stat-value">${stats.totalSearches}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">查询过的单词:</span>
                    <span class="stat-value">${stats.uniqueWords}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">用户修正:</span>
                    <span class="stat-value">${stats.corrections}</span>
                </div>
                <div class="top-roots">
                    <h4>常用词根 Top 10:</h4>
                    ${stats.topRoots.map(([root, count]) => 
                        `<div class="root-stat">${root}: ${count}次</div>`
                    ).join('')}
                </div>
                <div class="stats-actions">
                    <button onclick="enhancedDict.exportLearningData()">导出学习数据</button>
                    <button onclick="document.getElementById('importLearningFile').click()">导入学习数据</button>
                    <button onclick="closeStatsModal()">关闭</button>
                </div>
            </div>
        </div>
        <input type="file" id="importLearningFile" accept=".json" style="display:none" onchange="importLearningData(event)">
    `;
    
    document.body.insertAdjacentHTML('beforeend', statsHtml);
}

// 关闭统计模态框
function closeStatsModal() {
    const modal = document.querySelector('.stats-modal');
    if (modal) modal.remove();
}

// 导入学习数据
async function importLearningData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const message = await enhancedDict.importLearningData(file);
        alert(message);
        closeStatsModal();
    } catch (err) {
        alert('导入失败: ' + err);
    }
}

// 查找相似词汇
function findSimilarWords(word) {
    const similar = [];
    const wordLower = word.toLowerCase();
    
    // 在本地词典中查找相似词汇
    for (const [w, data] of Object.entries(wordDatabase)) {
        if (w !== wordLower && (w.includes(wordLower) || wordLower.includes(w))) {
            similar.push({ word: w, data });
        }
    }
    
    // 基于词根查找相似词汇
    const currentData = wordDatabase[wordLower];
    if (currentData && currentData.roots) {
        const currentRoots = currentData.roots.map(r => r.root.replace(/[-]/g, ''));
        
        for (const [w, data] of Object.entries(wordDatabase)) {
            if (w !== wordLower && data.roots) {
                const hasCommonRoot = data.roots.some(r => 
                    currentRoots.includes(r.root.replace(/[-]/g, ''))
                );
                if (hasCommonRoot && !similar.find(s => s.word === w)) {
                    similar.push({ word: w, data });
                }
            }
        }
    }
    
    displaySimilarWords(similar.slice(0, 10), word);
}

// 显示相似词汇
function displaySimilarWords(similar, originalWord) {
    if (similar.length === 0) {
        alert('未找到相似词汇');
        return;
    }
    
    const similarHtml = `
        <div class="similar-modal">
            <div class="similar-content">
                <h3>与 "${originalWord}" 相似的词汇</h3>
                <div class="similar-list">
                    ${similar.map(s => `
                        <div class="similar-item" onclick="searchSimilarWord('${s.word}')">
                            <div class="similar-word">${s.word}</div>
                            ${s.data.gloss ? `<div class="similar-gloss">${s.data.gloss.substring(0, 100)}...</div>` : ''}
                            ${s.data.roots ? `
                                <div class="similar-roots">
                                    ${s.data.roots.slice(0, 3).map(r => `<span class="similar-root">${r.root}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <button onclick="closeSimilarModal()">关闭</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', similarHtml);
}

// 搜索相似词汇
function searchSimilarWord(word) {
    closeSimilarModal();
    document.getElementById('searchInput').value = word;
    search();
}

// 关闭相似词汇模态框
function closeSimilarModal() {
    const modal = document.querySelector('.similar-modal');
    if (modal) modal.remove();
}
