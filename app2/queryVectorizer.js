module.exports = class QueryVectorizer{

    constructor(config, preprocessor){
        this.config = config;
        this.preprocessor = preprocessor;
    }

    vectorize(queryText){
        console.log(queryText)
        let query = queryText.substring(0, queryText.length > 50 ? 50 : queryText.length);
        let tokens = this.tokenize(query);
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

    tokenize(query){
        let config = this.config;
        config.separators = config.separators || [];
        config.charMap = config.charMap || false;
        config.minTokenLen = config.minTokenLen || 2;
        config.stopwords = config.stopwords || [];

        let result = [];
        let tokens = this.preprocessor.tokenizeMulti(query, config.separators);

        let i, j, isNotStopword, tokenIsLongEnough, stopword, token;

        for(i = 0; i < tokens.length; i++){
            tokens[i] = this.preprocessor.decapitalize(tokens[i]);
            tokens[i] = this.preprocessor.basicDepunctuation(tokens[i]);

            if(config.charMap){
                tokens[i] = this.preprocessor.reMapCharacters(tokens[i], config.charMap);
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