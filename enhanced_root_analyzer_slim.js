// 增强的词根分析器 - 精简版（仅算法，数据由 comprehensive_roots.js 提供）
const EnhancedRootAnalyzer = {
    // 数据容器（由 comprehensive_roots.js 填充）
    prefixes: {},
    suffixes: {},
    roots: {},
    
    // 特殊词汇处理（核心功能保留）
    specialWords: {
        "decipher": [
            { root: "de-", meaning: "去除，向下" },
            { root: "cipher", meaning: "密码，零" }
        ],
        "asparagus": [
            { root: "aspar", meaning: "芦笋" },
            { root: "ag", meaning: "做，驱动" },
            { root: "-us", meaning: "名词后缀" }
        ],
        "misunderstand": [
            { root: "mis-", meaning: "错误，坏" },
            { root: "under-", meaning: "在...下" },
            { root: "stand", meaning: "站立，理解" }
        ]
    },
    
    // 主要分析函数
    analyze(word) {
        const wordLower = word.toLowerCase();
        
        // 检查特殊词汇
        if (this.specialWords[wordLower]) {
            return this.specialWords[wordLower];
        }
        
        // 进行智能分析
        return this.intelligentAnalyze(wordLower);
    },
    
    // 智能分析算法
    intelligentAnalyze(word) {
        const components = [];
        let remaining = word;
        
        // 1. 检测前缀
        const prefixResult = this.detectPrefix(remaining);
        if (prefixResult) {
            components.push(prefixResult.component);
            remaining = prefixResult.remaining;
        }
        
        // 2. 检测后缀
        const suffixResult = this.detectSuffix(remaining);
        let suffixComponent = null;
        if (suffixResult) {
            suffixComponent = suffixResult.component;
            remaining = suffixResult.remaining;
        }
        
        // 3. 处理词根
        if (remaining) {
            const rootComponents = this.analyzeRoot(remaining);
            components.push(...rootComponents);
        }
        
        // 4. 添加后缀
        if (suffixComponent) {
            components.push(suffixComponent);
        }
        
        return components.length > 0 ? components : [{ root: word, meaning: "词根" }];
    },
    
    // 检测前缀
    detectPrefix(word) {
        for (const [prefix, meaning] of Object.entries(this.prefixes)) {
            const prefixClean = prefix.replace('-', '');
            if (word.startsWith(prefixClean) && word.length > prefixClean.length) {
                return {
                    component: { root: prefix, meaning: meaning },
                    remaining: word.substring(prefixClean.length)
                };
            }
        }
        return null;
    },
    
    // 检测后缀
    detectSuffix(word) {
        for (const [suffix, meaning] of Object.entries(this.suffixes)) {
            const suffixClean = suffix.replace('-', '');
            if (word.endsWith(suffixClean) && word.length > suffixClean.length) {
                return {
                    component: { root: suffix, meaning: meaning },
                    remaining: word.substring(0, word.length - suffixClean.length)
                };
            }
        }
        return null;
    },
    
    // 分析词根（递归分析）
    analyzeRoot(word) {
        // 直接匹配
        if (this.roots[word]) {
            return [{ root: word, meaning: this.roots[word] }];
        }
        
        // 检查是否为复合词（如 understand）
        const compoundResult = this.analyzeCompound(word);
        if (compoundResult.length > 1) {
            return compoundResult;
        }
        
        // 部分匹配
        for (const [root, meaning] of Object.entries(this.roots)) {
            if (word.includes(root) && root.length >= 3) {
                const components = [];
                const index = word.indexOf(root);
                
                // 前面部分
                if (index > 0) {
                    const before = word.substring(0, index);
                    const beforeComponents = this.analyzeRoot(before); // 递归分析
                    components.push(...beforeComponents);
                }
                
                // 匹配的词根
                components.push({ root: root, meaning: meaning });
                
                // 后面部分
                if (index + root.length < word.length) {
                    const after = word.substring(index + root.length);
                    const afterComponents = this.analyzeRoot(after); // 递归分析
                    components.push(...afterComponents);
                }
                
                return components;
            }
        }
        
        // 音节分割
        return this.syllableSegmentation(word);
    },
    
    // 分析复合词
    analyzeCompound(word) {
        const compounds = {
            "understand": [
                { root: "under-", meaning: "在...下" },
                { root: "stand", meaning: "站立，理解" }
            ],
            "overcome": [
                { root: "over-", meaning: "在...上" },
                { root: "come", meaning: "来" }
            ],
            "withdraw": [
                { root: "with-", meaning: "与...一起" },
                { root: "draw", meaning: "拉" }
            ]
        };
        
        if (compounds[word]) {
            return compounds[word];
        }
        
        return [{ root: word, meaning: "词根" }];
    },
    
    // 音节分割
    syllableSegmentation(word) {
        if (word.length <= 4) {
            return [{ root: word, meaning: "词根" }];
        }
        
        // 简单的音节分割
        const mid = Math.floor(word.length / 2);
        return [
            { root: word.substring(0, mid), meaning: "词根片段" },
            { root: word.substring(mid), meaning: "词根片段" }
        ];
    }
};

console.log('增强词根分析器（精简版）加载完成');