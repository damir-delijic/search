module.exports = class ReverseIndex{

    constructor(){
        this.dictionary = {};
    }

    contains(word){
        if(this.dictionary[word]) return true;
        else return false
    }

    getTermFrequency(term){
        if(this.contains(term)){
            return this.dictionary[term].a.length;
        }else{
            return 0;
        }
    }

    getTermAppearances(term){
        if(this.contains(term)){
            return this.dictionary[term].a;
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
            this.dictionary[word].a.push(appearance);
        }else{
            this.dictionary[word] = {
                a: [appearance]
            }
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
            for(i = 0; i < this.dictionary[word].a.length; i++){

                appearance = this.dictionary[word].a[i];
                if(appearance.s == source && appearance.i == id){
                    this.dictionary[word].a.splice(i, 1);
                    i -= 1;
                }
            }
            if(this.dictionary[word].a.length == 0){
                this.deleteWord(word)
            }
        }
    }

}
