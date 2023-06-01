const Preprocessor = require('./preprocessor')

module.exports = {
    vectorize: function(options){
        let text = options.text
        let config = options.config;
        let query = text.substring(0, text.length > config.maxQueryLen ? config.maxQueryLen : text.length);
        let tokens = internal.process(query, config);
        let entryVector = [];
        let i;
        for(i = 0; i < tokens.length; i++){
            entryVector.push({
                original: tokens[i],
                estimate: false,
                neighborhood: []
            });
        }
        return entryVector;
    }
}

let internal = {
    process: function(text, config){
        config.separators = config.separators || [];
        config.charMap = config.charMap || false;
        config.minTokenLen = config.minTokenLen || 2;
        config.stopwords = config.stopwords || [];
    
        let result = [];
        let tokens = Preprocessor.tokenize(text, config.separators);
    
        let i, j, isNotStopword, tokenIsLongEnough, stopword, token;
    
        for(i = 0; i < tokens.length; i++){
            tokens[i] = Preprocessor.decapitalize(tokens[i]);
            tokens[i] = Preprocessor.depunctuate(tokens[i]);
    
            if(config.charMap){
                tokens[i] = Preprocessor.reMapCharacters(tokens[i], config.charMap);
            }
    
            tokenIsLongEnough = tokens[i].length >= config.minTokenLen;
            
            if(tokenIsLongEnough){
                token = tokens[i];
                isNotStopword = true;
                for(j = 0; j < config.stopwords.length; j++){
                    stopword = config.stopwords[j];
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