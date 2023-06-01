const Preprocessor = require('./preprocessor');

module.exports = class Collection{

    constructor(options){
        this.config = options.config;
        this.defaultConfigNLP = options.defaultConfigNLP;
        this.name = options.name;
        this.reverseIndex = options.reverseIndex;
        this.trie = options.trie;
        this.data = [];
    }

    build(){
        // uzima podatke, stavlja u data
        if(this.config.type == "json"){
            let fs = require('fs');
            let data = JSON.parse(fs.readFileSync(this.config.path, 'utf8'));
            data = data.documents;
            let document, field;

            while(data.length > 0){
                let obj = {};
                document = data.shift();
                for(field in this.config.fields){
                    obj[field] = document[field];
                }
                this.data.push(obj);
            }
        }

        this.handleData();
    }

    fetch(list){
        if(this.config.type == "json"){
            return list;
        }
    }

    insert(document){
        this.handleDocument(document);
    }

    handleData(){
        let document;
        while(this.data.length > 0){
            document = this.data.shift();
            this.handleDocument(document);
        }
    }

    handleDocument(document){
        for(let field in document){
            this.handleField(document, field)
        }
    }

    handleField(document, field){
        let content, words, word, position;
        content = document[field];
        words = this.processText(content, field);

        for(position = 0; position < words.length; position++){
            word = words[position];
            this.reverseIndex.insert(word, this.name, document.id, field, position)
            this.trie.insert(word);
        }
    }

    processText(text, field){

        let defaultConfigNLP = this.defaultConfigNLP;
        let fieldSpecificSeparators = this.config.fields[field] ? this.config.fields[field].separators : false;
        let config = {
            separators: fieldSpecificSeparators || defaultConfigNLP.separators || [],
            punctuation: defaultConfigNLP.punctuation || false,
            charmap: defaultConfigNLP.charMap,
            stopwords: defaultConfigNLP.stopwords || [],
            minTokenLen: defaultConfigNLP.minTokenLen || 2
        }

        let separators = config.separators;
        let punctuation = config.punctuation;
        let charmap = config.charmap;
        let minTokenLen = config.minTokenLen;
        let stopwords = config.stopwords;
        let result = [];
        
        let tokens;
        tokens = Preprocessor.tokenize(text, separators);
        
        let i, j, isNotStopword, tokenIsLongEnough, stopword, token;

        for(i = 0; i < tokens.length; i++){
            tokens[i] = Preprocessor.decapitalize(tokens[i]);
            if(punctuation){
                tokens[i] = Preprocessor.customDepunctuate(tokens[i]);
            }else{
                tokens[i] = Preprocessor.depunctuate(tokens[i], punctuation)
            }

            if(charmap){
                tokens[i] = Preprocessor.reMapCharacters(tokens[i], charmap);
            }

            tokenIsLongEnough = tokens[i].length >= minTokenLen;
            
            if(tokenIsLongEnough){
                token = tokens[i];
                isNotStopword = true;
                for(j = 0; j < stopwords.length; j++){
                    stopword = stopwords[j];
                    if(token == stopword){
                        isNotStopword = false;
                        break;
                    }
                }
                if(isNotStopword) result.push(token);

            }

        }

        return result;
    }

}