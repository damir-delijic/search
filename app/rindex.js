module.exports = class Rindex{

    /* Invertovani index, pojam -> [lista pojava] */
    /* pojava ->  objekat koji sadrzi izvornu kolekciju, id dokumenta u toj kolekciji, polje i poziciju dokumenta na kojoj se javio pojam */
    /* s -> source, i -> id, f -> field, p -> position */
    /* TODO omoguciti konzistentno brisanje sa ostalim strukturama podataka */

    constructor(){
        this.dictionary = {};
    }

    contains(word){
        if(this.dictionary[word]) return true;
        else return false
    }

    getFrequency(term){
        if(this.contains(term)){
            return this.dictionary[term].length;
        }else{
            return 0;
        }
    }

    getAppearances(term){
        if(this.contains(term)){
            return this.dictionary[term];
        }else{
            return [];
        }
    }

    insert(word, source, id, field, position){

        let appearance = {
            s: source,
            i: id,
            f: field,
            p: position
        }

        if(this.contains(word)){
            this.dictionary[word].push(appearance);
        }else{
            this.dictionary[word] = [appearance]
        }

    }

    deleteWord(word){
        if(this.contains(word)){
            delete this.dictionary[word];
        }
    }

    deleteDocument(source, id){
        let word, appearance, i;
        
        for(word in this.dictionary){
            for(i = 0; i < this.dictionary[word].length; i++){

                appearance = this.dictionary[word][i];
                if(appearance.s == source && appearance.i == id){
                    this.dictionary[word].splice(i, 1);
                    i -= 1;
                }
            }
            if(this.dictionary[word].length == 0){
                this.deleteWord(word)
            }
        }
    }

}
