module.exports = class Preprocessor{
    
    constructor(){
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

    decapitalize(token){
        return token.toLowerCase();
    }

    capitalize(token){
        return token.toUpperCase();
    }

    basicDepunctuation(token){
        return token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'');
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