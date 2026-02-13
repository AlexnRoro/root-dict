// 增强的在线词典API和智能学习系统
class EnhancedDictionary {
    constructor() {
        this.apiEndpoints = [
            'https://api.dictionaryapi.dev/api/v2/entries/en/',
            'https://api.wordnik.com/v4/word.json/',
            'https://wordsapiv1.p.rapidapi.com/words/'
        ];
        this.learningData = this.loadLearningData();
        this.rootPatterns = this.initializeRootPatterns();
    }

    // 加载学习数据
    loadLearningData() {
        const data = localStorage.getItem('learningData');
        return data ? JSON.parse(data) : {
            searchHistory: [],
            rootFrequency: {},
            wordPatterns: {},
            userCorrections: {}
        };
    }

    // 保存学习数据
    saveLearningData() {
        localStorage.setItem('learningData', JSON.stringify(this.learningData));
    }

    // 初始化词根模式
    initializeRootPatterns() {
        return {
            prefixes: {
                'ab-': '离开，脱离', 'ad-': '向，朝', 'ante-': '在前', 'anti-': '反对',
                'auto-': '自动', 'bi-': '二', 'circum-': '周围', 'co-': '共同',
                'contra-': '反对', 'de-': '去除', 'dis-': '分离', 'ex-': '向外',
                'extra-': '超出', 'in-': '向内', 'inter-': '之间', 'intra-': '内部',
                'mis-': '错误', 'non-': '不', 'over-': '过度', 'post-': '之后',
                'pre-': '之前', 'pro-': '向前', 're-': '重新', 'semi-': '半',
                'sub-': '在下', 'super-': '超级', 'trans-': '穿过', 'un-': '不',
                'under-': '在下', 'uni-': '单一'
            },
            suffixes: {
                '-able': '能够的', '-ible': '能够的', '-al': '形容词后缀', '-ance': '名词后缀',
                '-ence': '名词后缀', '-ant': '形容词后缀', '-ent': '形容词后缀',
                '-ary': '形容词后缀', '-ery': '名词后缀', '-ful': '充满的',
                '-ic': '形容词后缀', '-ical': '形容词后缀', '-ism': '主义',
                '-ist': '表示人', '-ity': '名词后缀', '-ive': '形容词后缀',
                '-less': '没有的', '-ly': '副词后缀', '-ment': '名词后缀',
                '-ness': '名词后缀', '-ous': '形容词后缀', '-ship': '状态',
                '-tion': '名词后缀', '-sion': '名词后缀', '-ure': '名词后缀'
            },
            roots: {
                'act': '做，行动', 'anim': '生命，心灵', 'aud': '听', 'bio': '生命',
                'cap': '拿，抓', 'ced': '走', 'cept': '拿，接受', 'chron': '时间',
                'cid': '切，杀', 'cred': '相信', 'dict': '说', 'duc': '引导',
                'fac': '做，制造', 'fer': '带来，承受', 'fid': '信任', 'form': '形状',
                'gen': '产生', 'geo': '地球', 'graph': '写', 'ject': '投掷',
                'jud': '判断', 'lect': '选择', 'log': '说话，学问', 'luc': '光',
                'man': '手', 'mit': '送', 'mov': '移动', 'path': '感情，疾病',
                'ped': '脚', 'phon': '声音', 'port': '带来', 'pos': '放置',
                'press': '压', 'psych': '心理', 'rupt': '破裂', 'scrib': '写',
                'sect': '切', 'sent': '感觉', 'solut': '松开', 'solv': '解决',
                'spect': '看', 'struct': '建造', 'tact': '接触', 'ten': '拿，持',
                'tract': '拉', 'ven': '来', 'vers': '转', 'vid': '看',
                'vis': '看', 'voc': '声音，叫'
            }
        };
    }

    // 多API查询
    async searchMultipleAPIs(word) {
        const results = [];
        
        // API 1: Free Dictionary API
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (response.ok) {
                const data = await response.json();
                const parsed = this.parseFreeDict(data[0]);
                
                // 添加中文翻译
                const chineseTranslation = await this.getChineseTranslation(word);
                if (chineseTranslation) {
                    parsed.definitions.unshift(`中文: ${chineseTranslation}`);
                }
                
                results.push(parsed);
            }
        } catch (e) {
            console.log('Free Dictionary API failed:', e);
        }

        // 如果第一个API失败，尝试其他方法
        if (results.length === 0) {
            try {
                // 尝试获取中文翻译
                const chineseTranslation = await this.getChineseTranslation(word);
                const rootAnalysis = this.analyzeWordRoots(word);
                
                results.push({
                    word: word,
                    definitions: chineseTranslation ? [`中文: ${chineseTranslation}`, '词根分析结果'] : ['词根分析结果'],
                    phonetic: '',
                    roots: rootAnalysis,
                    source: 'root_analysis'
                });
            } catch (e) {
                console.log('Root analysis failed:', e);
            }
        }

        return results[0] || null;
    },
    
    // 获取中文翻译
    async getChineseTranslation(word) {
        try {
            // 使用有道翻译API（免费版）
            const response = await fetch(`https://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${encodeURIComponent(word)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.translateResult && data.translateResult[0] && data.translateResult[0][0]) {
                    return data.translateResult[0][0].tgt;
                }
            }
        } catch (e) {
            console.log('Chinese translation failed:', e);
        }
        
        // 备用：简单的词汇映射
        const commonWords = {
            'absolute': '绝对的',
            'beautiful': '美丽的',
            'wonderful': '精彩的',
            'asparagus': '芦笋',
            'incredible': '难以置信的',
            'transportation': '运输',
            'communication': '交流',
            'international': '国际的',
            'psychology': '心理学',
            'democracy': '民主',
            'geography': '地理学',
            'education': '教育',
            'information': '信息',
            'technology': '技术',
            'development': '发展',
            'government': '政府',
            'organization': '组织',
            'environment': '环境',
            'management': '管理',
            'relationship': '关系',
            'opportunity': '机会'
        };
        
        return commonWords[word.toLowerCase()] || null;
    }

    // 解析Free Dictionary API结果
    parseFreeDict(data) {
        const definitions = [];
        const phonetic = data.phonetic || '';
        
        data.meanings.forEach(meaning => {
            const partOfSpeech = meaning.partOfSpeech;
            meaning.definitions.slice(0, 3).forEach(def => {
                definitions.push(`${partOfSpeech}: ${def.definition}`);
            });
        });

        return {
            word: data.word,
            definitions: definitions,
            phonetic: phonetic,
            roots: this.analyzeWordRoots(data.word),
            source: 'free_dict'
        };
    }

    // 智能词根分析
    analyzeWordRoots(word) {
        const components = [];
        let remaining = word.toLowerCase();
        
        // 记录搜索历史
        this.learningData.searchHistory.push({
            word: word,
            timestamp: Date.now()
        });

        // 特殊单词处理
        if (remaining === 'asparagus') {
            components.push({ root: 'aspar', meaning: '芦笋' });
            components.push({ root: 'ag', meaning: '做，驱动' });
            components.push({ root: '-us', meaning: '名词后缀' });
            this.saveLearningData();
            return components;
        }

        // 查找前缀
        for (const [prefix, meaning] of Object.entries(this.rootPatterns.prefixes)) {
            const prefixClean = prefix.replace('-', '');
            if (remaining.startsWith(prefixClean) && remaining.length > prefixClean.length) {
                components.push({ root: prefix, meaning: meaning });
                remaining = remaining.substring(prefixClean.length);
                this.updateRootFrequency(prefix);
                break;
            }
        }

        // 查找后缀
        let suffixFound = null;
        for (const [suffix, meaning] of Object.entries(this.rootPatterns.suffixes)) {
            const suffixClean = suffix.replace('-', '');
            if (remaining.endsWith(suffixClean) && remaining.length > suffixClean.length) {
                suffixFound = { root: suffix, meaning: meaning };
                remaining = remaining.substring(0, remaining.length - suffixClean.length);
                this.updateRootFrequency(suffix);
                break;
            }
        }

        // 查找词根
        if (remaining) {
            const rootMatch = this.findBestRootMatch(remaining);
            if (rootMatch) {
                components.push(rootMatch);
                this.updateRootFrequency(rootMatch.root);
            } else {
                // 如果没有找到匹配的词根，尝试智能推断
                const inferredRoot = this.inferRoot(remaining, word);
                components.push(inferredRoot);
            }
        }

        // 添加后缀
        if (suffixFound) {
            components.push(suffixFound);
        }

        // 如果没有找到任何词根，提供基本分析
        if (components.length === 0) {
            components.push({ root: word, meaning: '词根（未知）' });
        }

        // 保存学习数据
        this.saveLearningData();

        return components;
    }

    // 查找最佳词根匹配 - 使用最长匹配原则
    findBestRootMatch(remaining) {
        let bestMatch = null;
        let bestLength = 0;

        for (const [root, meaning] of Object.entries(this.rootPatterns.roots)) {
            if (remaining.includes(root) && root.length > bestLength) {
                bestMatch = { root: root, meaning: meaning };
                bestLength = root.length;
            }
        }

        return bestMatch;
    }

    // 智能推断词根
    inferRoot(remaining, originalWord) {
        // 检查是否有用户修正记录
        if (this.learningData.userCorrections[originalWord]) {
            const correction = this.learningData.userCorrections[originalWord];
            return { root: remaining, meaning: correction.meaning };
        }

        // 基于相似词汇推断
        const similarWords = this.findSimilarWords(remaining);
        if (similarWords.length > 0) {
            const commonMeaning = this.extractCommonMeaning(similarWords);
            return { root: remaining, meaning: commonMeaning || '词根' };
        }

        return { root: remaining, meaning: '词根' };
    }

    // 查找相似词汇
    findSimilarWords(root) {
        const similar = [];
        for (const [word, data] of Object.entries(wordDatabase)) {
            if (word.includes(root) && word !== root) {
                similar.push({ word, data });
            }
        }
        return similar.slice(0, 5);
    }

    // 提取共同含义
    extractCommonMeaning(similarWords) {
        // 简单的启发式方法
        const meanings = similarWords.map(w => w.data.gloss || '').filter(m => m);
        if (meanings.length > 0) {
            return '相关含义';
        }
        return null;
    }

    // 更新词根频率
    updateRootFrequency(root) {
        if (!this.learningData.rootFrequency[root]) {
            this.learningData.rootFrequency[root] = 0;
        }
        this.learningData.rootFrequency[root]++;
    }

    // 用户修正词根
    correctRoot(word, rootIndex, newRoot, newMeaning) {
        if (!this.learningData.userCorrections[word]) {
            this.learningData.userCorrections[word] = {};
        }
        
        this.learningData.userCorrections[word][rootIndex] = {
            root: newRoot,
            meaning: newMeaning,
            timestamp: Date.now()
        };
        
        this.saveLearningData();
        
        // 更新词根模式
        this.rootPatterns.roots[newRoot] = newMeaning;
    }

    // 获取学习统计
    getLearningStats() {
        const totalSearches = this.learningData.searchHistory.length;
        const uniqueWords = new Set(this.learningData.searchHistory.map(h => h.word)).size;
        const topRoots = Object.entries(this.learningData.rootFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        return {
            totalSearches,
            uniqueWords,
            topRoots,
            corrections: Object.keys(this.learningData.userCorrections).length
        };
    }

    // 导出学习数据
    exportLearningData() {
        const data = {
            learningData: this.learningData,
            rootPatterns: this.rootPatterns,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `learning_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 导入学习数据
    importLearningData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.learningData) {
                        this.learningData = { ...this.learningData, ...data.learningData };
                    }
                    if (data.rootPatterns) {
                        this.rootPatterns = { ...this.rootPatterns, ...data.rootPatterns };
                    }
                    this.saveLearningData();
                    resolve('导入成功');
                } catch (err) {
                    reject('文件格式错误: ' + err.message);
                }
            };
            reader.readAsText(file);
        });
    }
}

// 全局实例
const enhancedDict = new EnhancedDictionary();

// 版本控制 - 用于缓存破坏
const APP_VERSION = '2.3';
window.APP_VERSION = APP_VERSION;