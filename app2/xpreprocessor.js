module.exports = class Preprocessor{
    
    constructor(){
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

    tokenizeMulti(segment, separators){
        let separator, i, segmentCopy;

        segmentCopy = segment;
        
        for(i = 0; i < separators.length; i++){
            separator = separators[i];
            segmentCopy = segmentCopy.replaceAll(separator, ' ');
        }

        return this.tokenizeSingle(segmentCopy, ' ');

    }

    tokenizeSingle(segment, separator){
        return segment.split(separator);
    }

    deCapitalize(token){
        return token.toLowerCase();
    }

    capitalize(token){
        return token.toUpperCase();
    }

    depunctuate(token, artifacts){
        let i, artifact, tokenCopy;

        tokenCopy = token;

        for(i = 0; i < artifacts.length; i++){
            artifact = artifacts[i];
            tokenCopy = tokenCopy.replaceAll(artifact, '');
        }

        return tokenCopy;
    }

    reMapCharacters(token, map){
        let result = '';
        let char;
        for(let i = 0; i < token.length; i++){
            char = token[i];
            if(map[char]){ // ako karakter postoji u mapi, zamijeni mapiranim
                result += map[char];
            }else{ // ako ne postoji samo nalijepi originalni
                result += char;
            }
        }
        return result;
    }

}