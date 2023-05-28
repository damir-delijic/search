module.exports = class Preprocessor{
    
    constructor(config){
        this.minLenToken = config.minLenToken;
        this.charMap = config.charMap;
        this.stopwords = config.stopwords;
    }

    process(segment, tokenLenIsIrrelevant){
        let result = [];
        let tokens = this.tokenize(segment);
        let j, isNotStopword, tokenLenIsAcceptable;
        for(let i = 0; i < tokens.length; i++){
            tokens[i] = this.capitalize(tokens[i]);
            tokens[i] = this.depunct(tokens[i]);
            tokens[i] = this.replaceChars(tokens[i]);
            tokenLenIsAcceptable = tokens[i].length >= this.minLenToken;
            if(tokenLenIsAcceptable || tokenLenIsIrrelevant ){
                isNotStopword = true;
                for(j = 0; j < this.stopwords.length; j++){
                    if(tokens[i] == this.stopwords[j]){
                        isNotStopword = false;
                        break;
                    }
                }
                if(isNotStopword) result.push(tokens[i]);
            }
        }
        return result;
    }

    tokenize(segment){
        return segment.split(' ');
    }

    capitalize(token){
        return token.toLowerCase();
    }

    depunct(token){
        return token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'');
    }

    replaceChars(token){
        let result = '';
        let char;
        for(let i = 0; i < token.length; i++){
            char = token[i];
            if(this.charMap[char]){ // ako karakter postoji u mapi, zamijeni mapiranim
                result += this.charMap[char];
            }else{ // ako ne postoji samo nalijepi originalni
                result += char;
            }
        }
        return result;
    }

}