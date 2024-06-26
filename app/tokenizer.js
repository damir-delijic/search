module.exports = class Tokenizer{
    
    /* Kada tokenizuje, podrazumijeva da je osnovni separator ' ' */
    /* Pretvara sve u mala slova */
    /* Otklanja znake interpunkcije, nije konfigurabilno */
    /* Preslikavanje karaktera (npr č -> c itd.) pomocu charMap u konfigu */
    
    /* TODO: Da bude konfigurabilnije, stemming, lemming */

    constructor(){}

    tokenize(segment, separators){
        let separator, i, temp;

        temp = segment;
        
        for(i = 0; i < separators.length; i++){
            separator = separators[i];
            temp = temp.replaceAll(separator, ' ');
        }

        return temp.split(' ');
    }

    decapitalize(token){
        return token.toLowerCase();
    }

    depunctuate(token){
        return token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'');
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